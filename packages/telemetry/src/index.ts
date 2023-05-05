import type { Span, SpanOptions, Tracer, Context, Attributes } from '@opentelemetry/api'
import type { BasicTracerProvider, SimpleSpanProcessor, BatchSpanProcessor, SpanExporter } from '@opentelemetry/sdk-trace-base'
import type { DetectorSync } from '@opentelemetry/resources'

import openTelemetry/*, { diag, DiagConsoleLogger, DiagLogLevel }*/ from '@opentelemetry/api'
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import { Resource, detectResourcesSync } from '@opentelemetry/resources'

const types = ['child', 'root'] as const

type AttachType = typeof types[number];

export type contextObject = { traceparent?: string }

export type startSpanOptions = {
  name: string
  attachType?: AttachType
  active?: boolean
  parentSpan?: Span
  isVerbose?: boolean
  opts?: SpanOptions
}

// Extend the span type to include span.name
type NamedSpan = Span & { name: string }

export type findActiveSpanOptions = (element: NamedSpan, index: number) => boolean

export interface TelemetryApi {
  startSpan(arg: startSpanOptions): Span | undefined | void
  getSpan(name: string): Span | undefined
  findActiveSpan(fn: findActiveSpanOptions): Span | undefined
  endActiveSpanAndChildren (span?: Span | undefined): void
  getActiveContextObject (): contextObject
  getResources (): Attributes
  shutdown (): Promise<void>
  getExporter (): SpanExporter | undefined
  setRootContext (rootContextObject?: contextObject): void
}

export class Telemetry implements TelemetryApi {
  tracer: Tracer
  spans: {[key: string]: Span}
  activeSpanQueue: Span[]
  rootContext?: Context
  provider: BasicTracerProvider
  exporter: SpanExporter

  constructor ({
    namespace,
    Provider,
    detectors,
    rootContextObject,
    version,
    SpanProcessor,
    exporter,
    resources = {},
  }: {
    namespace?: string
    Provider: typeof BasicTracerProvider
    detectors: DetectorSync[]
    rootContextObject?: contextObject
    version: string
    SpanProcessor: typeof SimpleSpanProcessor | typeof BatchSpanProcessor
    exporter: SpanExporter
    resources?: Attributes
  }) {
    // For troubleshooting, set the log level to DiagLogLevel.DEBUG
    // diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL)

    // Setup default resources
    const resource = Resource.default().merge(
      new Resource({
        ...resources,
        [ SemanticResourceAttributes.SERVICE_NAME ]: 'cypress-app',
        [ SemanticResourceAttributes.SERVICE_NAMESPACE ]: namespace,
        [ SemanticResourceAttributes.SERVICE_VERSION ]: version,
      }),
    )

    // Merge resources and create a new provider of the desired type.
    this.provider = new Provider({ resource: resource.merge(detectResourcesSync({ detectors })) })

    // Setup the exporter
    this.provider.addSpanProcessor(new SpanProcessor(exporter))

    // if enabled, set up the console exporter.
    if (process.env.CYPRESS_INTERNAL_USE_CONSOLE_EXPORTER === 'true') {
      const consoleExporter = new ConsoleSpanExporter()

      this.provider.addSpanProcessor(new SpanProcessor(consoleExporter))
    }

    // Initialize the provider
    this.provider.register()

    // Save off the tracer
    this.tracer = openTelemetry.trace.getTracer('cypress', version)

    this.setRootContext(rootContextObject)

    // store off the root context to apply to new spans
    if (rootContextObject && rootContextObject.traceparent) {
      this.rootContext = openTelemetry.propagation.extract(openTelemetry.context.active(), rootContextObject)
    }

    this.spans = {}
    this.activeSpanQueue = []
    this.exporter = exporter
  }

  /**
   * Starts a span with the given name. Stores off the span with the name as a key for later retrieval.
   * @param name - the span name
   * @param attachType - Should this span be attached as a new root span or a child of the previous root span.
   * @param name - Set true if this span should have child spans of it's own.
   * @param opts - pass through for otel span opts
   * @returns Span | undefined
   */
  startSpan ({
    name,
    attachType = 'child',
    active = false,
    parentSpan,
    opts = {},
  }: startSpanOptions) {
    // Currently the latest span replaces any previous open or closed span and you can no longer access the replaced span.
    // This works well enough for now but may cause issue in the future.

    let span: Span

    if (parentSpan) {
      // Create a context from the active span.
      const ctx = openTelemetry.trace.setSpan(openTelemetry.context.active(), parentSpan!)

      // Start span with parent context.
      span = this.tracer.startSpan(name, opts, ctx)
      // If root or implied root
    } else if (attachType === 'root' || this.activeSpanQueue.length < 1) {
      if (this.rootContext) {
        // Start span with external context
        span = this.tracer.startSpan(name, opts, this.rootContext)
      } else {
        // Start span with no context
        span = this.tracer.startSpan(name, opts)
      }
    } else { // attach type must be child
      // Create a context from the active span.
      const ctx = openTelemetry.trace.setSpan(openTelemetry.context.active(), this.activeSpanQueue[this.activeSpanQueue.length - 1]!)

      // Start span with parent context.
      span = this.tracer.startSpan(name, opts, ctx)
    }

    // Save off span, duplicate names currently not handled.
    this.spans[name] = span

    // If this is an active span, set it as the new active span
    if (active) {
      const _end = span.end

      // override the end function to allow us to pop the span off the queue if found.
      span.end = (endTime) => {
        // find the span in the queue by spanId
        const index = this.activeSpanQueue.findIndex((element: Span) => {
          return element.spanContext().spanId === span.spanContext().spanId
        })

        // if span exists, remove it from the queue
        if (index > -1) {
          this.activeSpanQueue.splice(index, 1)
        }

        _end.call(span, endTime)
      }

      this.activeSpanQueue.push(span)
    }

    return span
  }

  /**
   * Return requested span
   * @param name - span name to retrieve
   * @returns Span | undefined
   */
  getSpan (name: string) {
    return this.spans[name]
  }

  /**
   * Search the span queue for the active span that meets the criteria
   * @param fn - function to search the active spans
   * @returns Span | undefined
   */
  findActiveSpan (fn: findActiveSpanOptions): Span | undefined {
    return (this.activeSpanQueue as Array<NamedSpan>).find(fn)
  }

  /**
   * Ends specified active span and any active child spans
   * @param span - span to end
   */
  endActiveSpanAndChildren (span?: Span | undefined) {
    if (!span) {
      return
    }

    const startIndex = this.activeSpanQueue.findIndex((element: Span) => {
      return element.spanContext().spanId === span.spanContext().spanId
    })

    this.activeSpanQueue.slice(startIndex).forEach((spanToEnd) => {
      span.setAttribute('spanEndedPrematurely', true)
      spanToEnd?.end()
    })
  }

  /**
   * Returns the context object for the active span.
   * @returns the context
   */
  getActiveContextObject (): contextObject {
    const rootSpan = this.activeSpanQueue[this.activeSpanQueue.length - 1]

    // If no root span, nothing to return
    if (!rootSpan) {
      return {}
    }

    const ctx = openTelemetry.trace.setSpan(openTelemetry.context.active(), rootSpan)
    let myCtx = {}

    openTelemetry.propagation.inject(ctx, myCtx)

    return myCtx
  }

  /**
   * Gets a list of the resources currently set on the provider.
   * @returns Attributes of resources
   */
  getResources (): Attributes {
    return this.provider.resource.attributes
  }

  /**
   * Shuts down telemetry and flushes any batched spans.
   * @returns promise
   */
  shutdown () {
    return this.provider.shutdown()
  }

  /**
   * Returns the assigned exporter
   * @returns SpanExporter
   */
  getExporter () {
    return this.exporter
  }

  /**
   * Sets or resets the root context for spans
   * @param rootContextObject
   */
  setRootContext (rootContextObject?: contextObject): void {
    // store off the root context to apply to new spans
    if (rootContextObject && rootContextObject.traceparent) {
      this.rootContext = openTelemetry.propagation.extract(openTelemetry.context.active(), rootContextObject)
    }
  }
}

/**
 * The telemetry Noop class is used when telemetry is disabled.
 * It should mirror all the existing functions in telemetry, but no-op for
 * all operations.
 */
export class TelemetryNoop implements TelemetryApi {
  startSpan () {
    return undefined
  }
  getSpan () {
    return undefined
  }
  findActiveSpan () {
    return undefined
  }
  endActiveSpanAndChildren () {
    return undefined
  }
  getActiveContextObject (): contextObject {
    return {}
  }
  getResources () {
    return {}
  }
  shutdown () {
    return Promise.resolve()
  }
  getExporter () {
    return undefined
  }
  setRootContext () {}
}
