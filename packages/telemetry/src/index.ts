import openTelemetry from '@opentelemetry/api'
import { detectResourcesSync, Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import { OnStartSpanProcessor } from './processors/on-start-span-processor'
import { ConsoleTraceLinkExporter } from './span-exporters/console-trace-link-exporter'

import type { Span, SpanOptions, Tracer, Context, Attributes } from '@opentelemetry/api'
import type { BasicTracerProvider, SimpleSpanProcessor, BatchSpanProcessor, SpanExporter } from '@opentelemetry/sdk-trace-base'
import type { DetectorSync } from '@opentelemetry/resources'
const types = ['child', 'root'] as const

export const enabledValues = ['true', '1']

const environment = (process.env.CYPRESS_CONFIG_ENV || process.env.CYPRESS_INTERNAL_ENV || 'development')

const SERVICE_NAME = 'cypress-app'

type AttachType = typeof types[number];

export type contextObject = {context?: { traceparent?: string }, attributes?: Attributes}

export type startSpanOptions = {
  name: string
  attachType?: AttachType
  active?: boolean
  parentSpan?: Span
  isVerbose?: boolean
  key?: string
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
  rootAttributes?: Attributes
  provider: BasicTracerProvider
  exporter: SpanExporter
  isVerbose: boolean

  constructor ({
    namespace,
    Provider,
    detectors,
    rootContextObject,
    version,
    SpanProcessor,
    exporter,
    resources = {},
    isVerbose = false,
  }: {
    namespace: string
    Provider: typeof BasicTracerProvider
    detectors: DetectorSync[]
    rootContextObject?: contextObject
    version: string
    SpanProcessor: typeof SimpleSpanProcessor | typeof BatchSpanProcessor
    exporter: SpanExporter
    resources?: Attributes
    isVerbose: boolean
  }) {
    // For troubleshooting, set the log level to DiagLogLevel.DEBUG
    // import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api'
    // diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL)

    this.isVerbose = isVerbose

    // Setup default resources
    const resource = Resource.default().merge(
      new Resource({
        ...resources,
        [ SemanticResourceAttributes.SERVICE_NAME ]: SERVICE_NAME,
        [ SemanticResourceAttributes.SERVICE_NAMESPACE ]: namespace,
        [ SemanticResourceAttributes.SERVICE_VERSION ]: version,
      }),
    )

    // Merge resources and create a new provider of the desired type.
    this.provider = new Provider({
      resource: resource.merge(detectResourcesSync({ detectors })),
    })

    // Setup the exporter
    if (SpanProcessor.name === 'BatchSpanProcessor') {
      this.provider.addSpanProcessor(new SpanProcessor(exporter, {
        // Double the max queue size, We were seeing telemetry bursts that would result in loosing the top span.
        maxQueueSize: 4056,
      }))
    } else {
      this.provider.addSpanProcessor(new SpanProcessor(exporter))
    }

    // if local visualizations enabled, create composite exporter configured
    // to send to both local exporter and main exporter
    const honeyCombConsoleLinkExporter = new ConsoleTraceLinkExporter({
      serviceName: SERVICE_NAME,
      team: 'cypress',
      environment: (environment === 'production' ? 'cypress-app' : 'cypress-app-staging'),
    })

    this.provider.addSpanProcessor(new OnStartSpanProcessor(honeyCombConsoleLinkExporter))

    // Initialize the provider
    this.provider.register()

    // Save off the tracer
    this.tracer = openTelemetry.trace.getTracer('cypress', version)

    // store off the root context to apply to new spans
    this.setRootContext(rootContextObject)

    this.spans = {}
    this.activeSpanQueue = []
    this.exporter = exporter
  }

  /**
   * Starts a span with the given name. Stores off the span with the name as a key for later retrieval.
   * @param name - the span name
   * @param key - they key associated with the span, to be used to retrieve the span, if not specified, the name is used.
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
    key,
    isVerbose = false,
  }: startSpanOptions) {
    // Currently the latest span replaces any previous open or closed span and you can no longer access the replaced span.
    // This works well enough for now but may cause issue in the future.

    // if the span is declared in verbose mode, but verbosity is disabled, no-op the span creation
    if (isVerbose && !this.isVerbose) {
      return undefined
    }

    let span: Span

    let parent: Span | undefined

    if (attachType === 'root' || (this.activeSpanQueue.length < 1 && !parentSpan)) {
      if (this.rootContext) {
        // Start span with external context
        span = this.tracer.startSpan(name, opts, this.rootContext)

        // This can only apply attributes set on the external root set up until the point at which it was sent.
        if (this.rootAttributes) {
          span.setAttributes(this.rootAttributes)
        }
      } else {
        // Start span with no context
        span = this.tracer.startSpan(name, opts)
      }
    } else { // attach type must be child
      // Prefer passed in parent
      parent = parentSpan || this.activeSpanQueue[this.activeSpanQueue.length - 1]

      // Create a context from the active span.
      const ctx = openTelemetry.trace.setSpan(openTelemetry.context.active(), parent!)

      // Start span with parent context.
      span = this.tracer.startSpan(name, opts, ctx)
    }

    //span keys must be unique, names do not.
    if (environment === 'development' && key && key in this.spans) {
      throw new Error(`Span key ${key} rejected. Span key already exists in spans map.`)
    }

    // Save off span
    const spanKey = key || name

    this.spans[spanKey] = span

    // Setup function on span to recursively get parent attributes.
    // Not bothering with types here since we only need this function within this function.
    // @ts-expect-error
    span.getAllAttributes = () => {
      // @ts-expect-error
      const parentAttributes = parent && parent.getAllAttributes ? parent.getAllAttributes() : {}

      const allAttributes = {
        // @ts-expect-error
        ...span.attributes,
        ...parentAttributes,
      }

      // never propagate name
      delete allAttributes['name']

      return allAttributes
    }

    // override the end function to allow us to pop the span off the queue if found.
    const _end = span.end

    span.end = (endTime) => {
      if (active) {
        // find the span in the queue by spanId
        const index = this.activeSpanQueue.findIndex((element: Span) => {
          return element.spanContext().spanId === span.spanContext().spanId
        })

        // if span exists, remove it from the queue
        if (index > -1) {
          this.activeSpanQueue.splice(index, 1)
        }
      }

      // On span end recursively grab parent attributes
      // @ts-ignore
      if (parent && parent.getAllAttributes) {
        // @ts-ignore
        span.setAttributes(parent.getAllAttributes())
      }

      _end.call(span, endTime)
    }

    // If this is an active span, set it as the new active span
    if (active) {
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

    // @ts-expect-error
    return { context: myCtx, attributes: rootSpan.getAllAttributes() }
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
    if (rootContextObject && rootContextObject.context && rootContextObject.context.traceparent) {
      this.rootContext = openTelemetry.propagation.extract(openTelemetry.context.active(), rootContextObject.context)
      this.rootAttributes = rootContextObject.attributes
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
