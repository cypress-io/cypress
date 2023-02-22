import type { Span, Tracer, Context } from '@opentelemetry/api'
import type { BasicTracerProvider } from '@opentelemetry/sdk-trace-base'
import type { Detector } from '@opentelemetry/resources'

import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import openTelemetry/*, { diag, DiagConsoleLogger, DiagLogLevel }*/ from '@opentelemetry/api'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import { Resource, detectResources } from '@opentelemetry/resources'

const types = ['child', 'root'] as const

type AttachType = typeof types[number];

export class Telemetry {
  tracer: Tracer
  spans: {}
  spanQueue: Span[]
  rootContext: Context | undefined
  provider: BasicTracerProvider

  private constructor (tracer, provider, rootContext) {
    this.tracer = tracer
    this.provider = provider
    this.rootContext = rootContext
    this.spans = {}
    this.spanQueue = []
  }

  static async init ({
    namespace,
    Provider,
    detectors,
    rootContextObject,
    version,
    key,
  }: {
    namespace: string | undefined
    Provider: typeof BasicTracerProvider
    detectors: Detector[]
    rootContextObject?: {traceparent: string}
    version: string
    key: string
  }) {
    // For troubleshooting, set the log level to DiagLogLevel.DEBUG
    // diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL)

    const exporter = new OTLPTraceExporter({
      url: 'https://api.honeycomb.io/v1/traces',
      headers: {
        'x-honeycomb-team': key,
      },
    })

    const resource = Resource.default().merge(
      new Resource({
        [ SemanticResourceAttributes.SERVICE_NAME ]: 'cypress-app',
        [ SemanticResourceAttributes.SERVICE_NAMESPACE ]: namespace,
        [ SemanticResourceAttributes.SERVICE_VERSION ]: version,
      }),
    )

    const provider = new Provider({ resource: resource.merge(await detectResources({ detectors })) })

    // Setup the console exporter
    provider.addSpanProcessor(new BatchSpanProcessor(exporter))

    // Initialize the provider
    provider.register()

    const tracer = openTelemetry.trace.getTracer('cypress', version)

    // store off the root context to apply to new spans
    let rootContext

    if (rootContextObject) {
      rootContext = openTelemetry.propagation.extract(openTelemetry.context.active(), rootContextObject)
    }

    return new Telemetry(tracer, provider, rootContext)
  }

  startSpan ({
    name,
    attachType = 'child',
    active = false,
  }: {
    name: string
    attachType?: AttachType
    active?: boolean
  }): Span | undefined {
    // TODO: what do we do with duplicate names?
    // if (spans[name]) {
    //   throw 'Span name already defined'
    // }

    let span

    // TODO: Do we need to be able to attach to a provided context or attach as a sibling?

    if (attachType === 'root' || this.spanQueue.length < 1) {
      if (this.rootContext) {
        span = this.tracer.startSpan(name, {}, this.rootContext)
      } else {
        span = this.tracer.startSpan(name)
      }
    } else if (attachType === 'child') {
      const ctx = openTelemetry.trace.setSpan(openTelemetry.context.active(), this.spanQueue[this.spanQueue.length - 1])

      span = this.tracer.startSpan(name, {}, ctx)
    }

    this.spans[name] = span

    if (active) {
      const _end = span.end

      // override the end function to allow us to pop the span off the queue if found.
      span.end = (endTime) => {
      // find the span in the queue by spanId
        const index = this.spanQueue.findIndex((element: Span) => {
          return element.spanContext().spanId === span.spanContext().spanId
        })

        // if span exists, remove it from the queue
        if (index > -1) {
          this.spanQueue.splice(index, 1)
        }

        _end.call(span, endTime)
      }

      this.spanQueue.push(span)
    }

    return span
  }

  getSpan (name: string): Span | undefined {
    return this.spans[name]
  }

  getRootContextObject (): {} {
    const rootSpan = this.spanQueue[0]

    if (!rootSpan) {
      return {}
    }

    const ctx = openTelemetry.trace.setSpan(openTelemetry.context.active(), rootSpan)
    let myCtx = {}

    openTelemetry.propagation.inject(ctx, myCtx)

    return myCtx
  }

  forceFlush (): Promise<void> {
    return this.provider.forceFlush()
  }
}

export class TelemetryNoop {
  startSpan () {}
  getSpan () {}
  getRootContextObject () {
    return {}
  }
  forceFlush () {
    return Promise.resolve()
  }
}
