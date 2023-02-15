import type { Span } from '@opentelemetry/api'
import type { BasicTracerProvider } from '@opentelemetry/sdk-trace-base'

import { ConsoleSpanExporter, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import openTelemetry from '@opentelemetry/api'
// import pkg from '@packages/root'

let _tracer
const spans = {} // Key value name to span object.
const spanQueue: Span[] = []
let _prefix
let _rootContext
let _provider

const init = (prefix, provider: BasicTracerProvider, rootContextObject, exporter) => {
  _prefix = prefix
  _provider = provider

  // Setup the console exporter
  _provider.addSpanProcessor(new BatchSpanProcessor(new ConsoleSpanExporter()))
  _provider.addSpanProcessor(new BatchSpanProcessor(exporter))

  // Initialize the provider
  _provider.register()

  // TODO: place the version on the tracer
  _tracer = openTelemetry.trace.getTracer('cypress')

  // store off the root context to apply to new spans
  if (rootContextObject) {
    _rootContext = openTelemetry.propagation.extract(openTelemetry.context.active(), rootContextObject)
  }
}

const startSpan = (name): Span | undefined => {
  if (!_tracer) {
    return
  }

  // TODO: what do we do with duplicate names?
  // if (spans[name]) {
  //   throw 'Span name already defined'
  // }

  let span

  // TODO: do we need the ability to override the auto assignment of a parent?
  if (spanQueue.length > 0) {
    const ctx = openTelemetry.trace.setSpan(openTelemetry.context.active(), spanQueue[spanQueue.length - 1])

    span = _tracer.startSpan(`${_prefix}:${name}`, {}, ctx)
  } else if (_rootContext) {
    span = _tracer.startSpan(`${_prefix}:${name}`, {}, _rootContext)
  } else {
    span = _tracer.startSpan(`${_prefix}:${name}`)
  }

  const _end = span.end

  // override the end function to allow us to pop the span off the queue if found.
  span.end = (endTime) => {
    // find the span in the queue by spanId
    const index = spanQueue.findIndex((element: Span) => {
      return element.spanContext().spanId === span.spanContext().spanId
    })

    // if span exists, remove it from the queue
    if (index > -1) {
      spanQueue.splice(index, 1)
    }

    _end.call(span, endTime)
  }

  spans[name] = span
  spanQueue.push(span)

  return span
}

const getSpan = (name: string): Span | undefined => {
  return spans[name]
}

const getRootSpan = (): Span | undefined => {
  return spanQueue[0]
}

const getContext = () => {
  const rootSpan = getRootSpan()

  if (!rootSpan) {
    return {}
  }

  const ctx = openTelemetry.trace.setSpan(openTelemetry.context.active(), rootSpan)
  let myCtx = {}

  openTelemetry.propagation.inject(ctx, myCtx)

  return myCtx
}

const forceFlush = () => {
  if (_provider) {
    return _provider.forceFlush()
  }

  return Promise.resolve()
}

export const telemetry = {
  init,
  startSpan,
  getSpan,
  getRootSpan,
  getContext,
  forceFlush,
}
