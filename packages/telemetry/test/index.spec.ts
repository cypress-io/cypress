import { describe, it, expect } from 'vitest'
import { Telemetry } from '../src/telemetry'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'

import { OTLPTraceExporter as OTLPTraceExporterCloud } from '../src/span-exporters/cloud-span-exporter'

describe('init', () => {
  it('creates a new instance', () => {
    const exporter = new OTLPTraceExporterCloud()

    const tel = new Telemetry({
      namespace: 'namespace',
      Provider: NodeTracerProvider,
      detectors: [],
      exporter,
      version: 'version',
      SpanProcessor: BatchSpanProcessor,
      isVerbose: false,
    })

    expect(tel).toBeDefined()
    expect(tel.provider).is.instanceOf(NodeTracerProvider)
    expect(tel.provider.resource.attributes['service.namespace']).toEqual('namespace')
    expect(tel.provider.resource.attributes['service.version']).toEqual('version')
    expect(tel.provider.resource.attributes['service.name']).toEqual('cypress-app')
    // @ts-expect-error
    expect(tel.provider.activeSpanProcessor._spanProcessors[0]).toBeInstanceOf(BatchSpanProcessor)
    expect(tel.getExporter()).toEqual(exporter)
    expect(tel.rootContext).toBeUndefined()
  })

  it('creates a new instance with root context', () => {
    const exporter = new OTLPTraceExporterCloud()

    const tel = new Telemetry({
      namespace: 'namespace',
      Provider: NodeTracerProvider,
      detectors: [],
      exporter,
      version: 'version',
      rootContextObject: { context: { traceparent: '00-a14c8519972996a2a0748f2c8db5a775-4ad8bd26672a01b0-01' }, attributes: { yes: 'no' } },
      SpanProcessor: BatchSpanProcessor,
      isVerbose: false,
    })

    expect(tel).toBeDefined()
    expect(tel.rootContext).toBeDefined()
    expect(tel.rootAttributes).toBeDefined()
  })
})

describe('startSpan', () => {
  it('starts a span with an external parent id', () => {
    const exporter = new OTLPTraceExporterCloud()

    const tel = new Telemetry({
      namespace: 'namespace',
      Provider: NodeTracerProvider,
      detectors: [],
      exporter,
      version: 'version',
      rootContextObject: { context: { traceparent: '00-a14c8519972996a2a0748f2c8db5a775-4ad8bd26672a01b0-01' } },
      SpanProcessor: BatchSpanProcessor,
      isVerbose: false,
    })

    const span = tel.startSpan({ name: 'span' })

    // @ts-expect-error
    expect(span.name).toEqual('span')
    // @ts-expect-error
    expect(span.parentSpanId).toEqual('4ad8bd26672a01b0')
    expect(tel.activeSpanQueue.length).toBeLessThan(1)
    // @ts-expect-error
    expect(tel.spans[span.name]).toEqual(span)
  })

  it('starts a span with no parent id', () => {
    const exporter = new OTLPTraceExporterCloud()

    const tel = new Telemetry({
      namespace: 'namespace',
      Provider: NodeTracerProvider,
      detectors: [],
      exporter,
      version: 'version',
      SpanProcessor: BatchSpanProcessor,
      isVerbose: false,
    })

    const span = tel.startSpan({ name: 'span' })

    // @ts-expect-error
    expect(span.name).toEqual('span')
    // @ts-expect-error
    expect(span.parentSpanId).toBeUndefined()
  })

  it('starts a span with specific parent', () => {
    const exporter = new OTLPTraceExporterCloud()

    const tel = new Telemetry({
      namespace: 'namespace',
      Provider: NodeTracerProvider,
      detectors: [],
      exporter,
      version: 'version',
      SpanProcessor: BatchSpanProcessor,
      isVerbose: false,
    })

    const parentSpan = tel.startSpan({ name: 'parentSpan' })

    const span = tel.startSpan({ name: 'span', parentSpan })

    // @ts-expect-error
    expect(span.name).toEqual('span')
    // @ts-expect-error
    expect(span.parentSpanId).toEqual(parentSpan._spanContext.spanId)
    expect(tel.activeSpanQueue.length).toBeLessThan(1)
  })

  it('starts an active span', () => {
    const exporter = new OTLPTraceExporterCloud()

    const tel = new Telemetry({
      namespace: 'namespace',
      Provider: NodeTracerProvider,
      detectors: [],
      exporter,
      version: 'version',
      SpanProcessor: BatchSpanProcessor,
      isVerbose: false,
    })

    const span = tel.startSpan({ name: 'span', active: true })

    // @ts-expect-error
    expect(span.name).toEqual('span')
    // @ts-expect-error
    expect(span.parentSpanId).toBeUndefined()
    // @ts-expect-error
    expect(tel.activeSpanQueue[0].name).toEqual('span')

    // Start a child that should have the previous span as a parent
    const spanChild = tel.startSpan({ name: 'child' })

    // @ts-expect-error
    expect(spanChild.name).toEqual('child')
    // @ts-expect-error
    expect(spanChild.parentSpanId).toEqual(span._spanContext.spanId)

    // Start a root child that does not have the active parent
    const spanRoot = tel.startSpan({ name: 'root', attachType: 'root' })

    // @ts-expect-error
    expect(spanRoot.name).toEqual('root')
    // @ts-expect-error
    expect(spanRoot.parentSpanId).toBeUndefined()

    // end the active span to see it removed from the queue
    span?.end()

    expect(tel.activeSpanQueue.length).toBeLessThan(1)
  })

  it('starts a span with key other than name', () => {
    const exporter = new OTLPTraceExporterCloud()

    const tel = new Telemetry({
      namespace: 'namespace',
      Provider: NodeTracerProvider,
      detectors: [],
      exporter,
      version: 'version',
      SpanProcessor: BatchSpanProcessor,
      isVerbose: false,
    })

    const span = tel.startSpan({ name: 'span', key: 'key' })

    const retrievedSpan = tel.getSpan('key')

    // @ts-expect-error
    expect(retrievedSpan.name).toEqual('span')
    // @ts-expect-error
    expect(retrievedSpan._spanContext.spanId).toEqual(span._spanContext.spanId)
  })
})

describe('getSpan', () => {
  it('retrieves the span', () => {
    const exporter = new OTLPTraceExporterCloud()

    const tel = new Telemetry({
      namespace: 'namespace',
      Provider: NodeTracerProvider,
      detectors: [],
      exporter,
      version: 'version',
      // @ts-expect-error
      rootContextObject: { traceparent: 'id' },
      SpanProcessor: BatchSpanProcessor,
    })

    const spanny = tel.startSpan({ name: 'spanny' })

    expect(tel.getSpan('spanny')).toEqual(spanny)

    expect(tel.getSpan('not-found')).toBeUndefined()
  })
})

describe('findActiveSpan', () => {
  it('finds a span', () => {
    const exporter = new OTLPTraceExporterCloud()

    const tel = new Telemetry({
      namespace: 'namespace',
      Provider: NodeTracerProvider,
      detectors: [],
      exporter,
      version: 'version',
      rootContextObject: { context: { traceparent: 'id' } },
      SpanProcessor: BatchSpanProcessor,
      isVerbose: false,
    })

    const spanny = tel.startSpan({ name: 'spanny', active: true })

    tel.startSpan({ name: 'spannyChild', active: true })

    const foundSpan = tel.findActiveSpan((span) => {
      return span.name === 'spanny'
    })

    expect(foundSpan).toEqual(spanny)
  })
})

describe('endActiveSpanAndChildren', () => {
  it('ends the active span', () => {
    const exporter = new OTLPTraceExporterCloud()

    const tel = new Telemetry({
      namespace: 'namespace',
      Provider: NodeTracerProvider,
      detectors: [],
      exporter,
      version: 'version',
      rootContextObject: { context: { traceparent: 'id' } },
      SpanProcessor: BatchSpanProcessor,
      isVerbose: false,
    })

    const spanny = tel.startSpan({ name: 'spanny', active: true })

    expect(spanny).toBeDefined()

    tel.startSpan({ name: 'spannyChild', active: true })

    expect(tel.activeSpanQueue.length).toEqual(2)

    tel.endActiveSpanAndChildren(spanny)

    expect(tel.activeSpanQueue.length).toEqual(0)

    tel.endActiveSpanAndChildren(spanny)

    expect(tel.activeSpanQueue.length).toEqual(0)
  })
})

describe('getActiveContextObject', () => {
  it('returns the active Context Object', () => {
    const exporter = new OTLPTraceExporterCloud()

    const tel = new Telemetry({
      namespace: 'namespace',
      Provider: NodeTracerProvider,
      detectors: [],
      exporter,
      version: 'version',
      rootContextObject: { context: { traceparent: 'id' } },
      SpanProcessor: BatchSpanProcessor,
      isVerbose: false,
    })

    const emptyContext = tel.getActiveContextObject()

    expect(emptyContext.context).toBeUndefined()

    tel.startSpan({ name: 'spanny', active: true })

    const context = tel.getActiveContextObject()

    expect(context.context.traceparent).toBeDefined()
  })
})

describe('getResources', () => {
  it('returns the active resources', () => {
    const exporter = new OTLPTraceExporterCloud()

    const tel = new Telemetry({
      namespace: 'namespace',
      Provider: NodeTracerProvider,
      detectors: [],
      exporter,
      version: 'version',
      // @ts-expect-error
      rootContextObject: { traceparent: 'id' },
      SpanProcessor: BatchSpanProcessor,
      resources: {
        herp: 'derp',
        'service.name': 'not overridden',
      },
      isVerbose: false,
    })

    expect(tel.getResources()).toEqual(expect.objectContaining({
      'service.name': 'cypress-app',
      'telemetry.sdk.language': 'nodejs',
      'telemetry.sdk.name': 'opentelemetry',
      herp: 'derp',
      'service.namespace': 'namespace',
      'service.version': 'version',
    }))
  })
})

describe('shutdown', () => {
  it('confirms shutdown is called', async () => {
    const exporter = new OTLPTraceExporterCloud()

    const tel = new Telemetry({
      namespace: 'namespace',
      Provider: NodeTracerProvider,
      detectors: [],
      exporter,
      version: 'version',
      // @ts-expect-error
      rootContextObject: { traceparent: 'id' },
      SpanProcessor: BatchSpanProcessor,
      isVerbose: false,
    })

    let shutdownCalled = false

    // @ts-expect-error
    tel.provider = { shutdown: () => {
      shutdownCalled = true

      return Promise.resolve()
    } }

    await tel.shutdown()

    expect(shutdownCalled).toBe(true)
  })
})

describe('getExporter', () => {
  it('returns the exporter', async () => {
    const exporter = new OTLPTraceExporterCloud()

    const tel = new Telemetry({
      namespace: 'namespace',
      Provider: NodeTracerProvider,
      detectors: [],
      exporter,
      version: 'version',
      // @ts-expect-error
      rootContextObject: { traceparent: 'id' },
      SpanProcessor: BatchSpanProcessor,
      isVerbose: false,
    })

    expect(tel.getExporter()).toEqual(exporter)
  })
})

describe('setRootContext', () => {
  it('sets root context', () => {
    const exporter = new OTLPTraceExporterCloud()

    const tel = new Telemetry({
      namespace: 'namespace',
      Provider: NodeTracerProvider,
      detectors: [],
      exporter,
      version: 'version',
      rootContextObject: { context: { traceparent: '00-a14c8519972996a2a0748f2c8db5a775-4ad8bd26672a01b0-01' } },
      SpanProcessor: BatchSpanProcessor,
      isVerbose: false,
    })

    // @ts-expect-error
    expect(tel.rootContext?.getValue(Symbol.for('OpenTelemetry Context Key SPAN'))._spanContext.spanId).toEqual('4ad8bd26672a01b0')

    tel.setRootContext({ context: { traceparent: '00-a14c8519972996a2a0748f2c8db5a775-4ad8bd26672a01b1-01' } })

    // @ts-expect-error
    expect(tel.rootContext?.getValue(Symbol.for('OpenTelemetry Context Key SPAN'))._spanContext.spanId).toEqual('4ad8bd26672a01b1')
  })

  it('sets root context', () => {
    const exporter = new OTLPTraceExporterCloud()

    const tel = new Telemetry({
      namespace: 'namespace',
      Provider: NodeTracerProvider,
      detectors: [],
      exporter,
      version: 'version',
      rootContextObject: { context: { traceparent: '00-a14c8519972996a2a0748f2c8db5a775-4ad8bd26672a01b0-01' } },
      SpanProcessor: BatchSpanProcessor,
      isVerbose: false,
    })

    // @ts-expect-error
    expect(tel.rootContext?.getValue(Symbol.for('OpenTelemetry Context Key SPAN'))._spanContext.spanId).toEqual('4ad8bd26672a01b0')

    tel.setRootContext()

    // @ts-expect-error
    expect(tel.rootContext?.getValue(Symbol.for('OpenTelemetry Context Key SPAN'))._spanContext.spanId).toEqual('4ad8bd26672a01b0')

    tel.setRootContext({})

    // @ts-expect-error
    expect(tel.rootContext?.getValue(Symbol.for('OpenTelemetry Context Key SPAN'))._spanContext.spanId).toEqual('4ad8bd26672a01b0')
  })
})
