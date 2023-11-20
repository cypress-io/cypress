import { expect } from 'chai'

import { Telemetry } from '../src'

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
    })

    expect(tel).to.not.be.undefined
    expect(tel.provider).is.instanceOf(NodeTracerProvider)
    expect(tel.provider.resource.attributes['service.namespace']).to.equal('namespace')
    expect(tel.provider.resource.attributes['service.version']).to.equal('version')
    expect(tel.provider.resource.attributes['service.name']).to.equal('cypress-app')
    // @ts-expect-error
    expect(tel.provider.activeSpanProcessor._spanProcessors[0]).is.instanceOf(BatchSpanProcessor)
    expect(tel.getExporter()).to.equal(exporter)
    expect(tel.rootContext).to.be.undefined
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
    })

    expect(tel).to.not.be.undefined
    expect(tel.rootContext).to.not.be.undefined
    expect(tel.rootAttributes).to.not.be.undefined
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
    })

    const span = tel.startSpan({ name: 'span' })

    // @ts-expect-error
    expect(span.name).to.equal('span')
    // @ts-expect-error
    expect(span.parentSpanId).to.equal('4ad8bd26672a01b0')
    expect(tel.activeSpanQueue.length).to.be.lessThan(1)
    // @ts-expect-error
    expect(tel.spans[span.name]).to.equal(span)
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
    })

    const span = tel.startSpan({ name: 'span' })

    // @ts-expect-error
    expect(span.name).to.equal('span')
    // @ts-expect-error
    expect(span.parentSpanId).to.be.undefined
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
    })

    const parentSpan = tel.startSpan({ name: 'parentSpan' })

    const span = tel.startSpan({ name: 'span', parentSpan })

    // @ts-expect-error
    expect(span.name).to.equal('span')
    // @ts-expect-error
    expect(span.parentSpanId).to.equal(parentSpan._spanContext.spanId)
    expect(tel.activeSpanQueue.length).to.be.lessThan(1)
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
    })

    const span = tel.startSpan({ name: 'span', active: true })

    // @ts-expect-error
    expect(span.name).to.equal('span')
    // @ts-expect-error
    expect(span.parentSpanId).to.be.undefined
    // @ts-expect-error
    expect(tel.activeSpanQueue[0].name).to.equal('span')

    // Start a child that should have the previous span as a parent
    const spanChild = tel.startSpan({ name: 'child' })

    // @ts-expect-error
    expect(spanChild.name).to.equal('child')
    // @ts-expect-error
    expect(spanChild.parentSpanId).to.equal(span._spanContext.spanId)

    // Start a root child that does not have the active parent
    const spanRoot = tel.startSpan({ name: 'root', attachType: 'root' })

    // @ts-expect-error
    expect(spanRoot.name).to.equal('root')
    // @ts-expect-error
    expect(spanRoot.parentSpanId).to.be.undefined

    // end the active span to see it removed from the queue
    span?.end()

    expect(tel.activeSpanQueue.length).to.be.lessThan(1)
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
    })

    const span = tel.startSpan({ name: 'span', key: 'key' })

    const retrievedSpan = tel.getSpan('key')

    // @ts-expect-error
    expect(retrievedSpan.name).to.equal('span')
    // @ts-expect-error
    expect(retrievedSpan._spanContext.spanId).to.equal(span._spanContext.spanId)
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
      rootContextObject: { traceparent: 'id' },
      SpanProcessor: BatchSpanProcessor,
    })

    const spanny = tel.startSpan({ name: 'spanny' })

    expect(tel.getSpan('spanny')).to.equal(spanny)

    expect(tel.getSpan('not-found')).to.be.undefined
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
    })

    const spanny = tel.startSpan({ name: 'spanny', active: true })

    tel.startSpan({ name: 'spannyChild', active: true })

    const foundSpan = tel.findActiveSpan((span) => {
      return span.name === 'spanny'
    })

    expect(foundSpan).to.equal(spanny)
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
    })

    const spanny = tel.startSpan({ name: 'spanny', active: true })

    expect(spanny).to.exist

    tel.startSpan({ name: 'spannyChild', active: true })

    expect(tel.activeSpanQueue.length).to.equal(2)

    tel.endActiveSpanAndChildren(spanny)

    expect(tel.activeSpanQueue.length).to.equal(0)

    tel.endActiveSpanAndChildren(spanny)

    expect(tel.activeSpanQueue.length).to.equal(0)
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
    })

    const emptyContext = tel.getActiveContextObject()

    expect(emptyContext.context).to.be.undefined

    tel.startSpan({ name: 'spanny', active: true })

    const context = tel.getActiveContextObject()

    expect(context.context.traceparent).to.exist
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
      rootContextObject: { traceparent: 'id' },
      SpanProcessor: BatchSpanProcessor,
      resources: {
        herp: 'derp',
        'service.name': 'not overridden',
      },
    })

    expect(tel.getResources()).to.contain({
      'service.name': 'cypress-app',
      'telemetry.sdk.language': 'nodejs',
      'telemetry.sdk.name': 'opentelemetry',
      herp: 'derp',
      'service.namespace': 'namespace',
      'service.version': 'version',
    })
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
      rootContextObject: { traceparent: 'id' },
      SpanProcessor: BatchSpanProcessor,
    })

    let shutdownCalled = false

    // @ts-expect-error
    tel.provider = { shutdown: () => {
      shutdownCalled = true

      return Promise.resolve()
    } }

    await tel.shutdown()

    expect(shutdownCalled).to.be.true
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
      rootContextObject: { traceparent: 'id' },
      SpanProcessor: BatchSpanProcessor,
    })

    expect(tel.getExporter()).to.equal(exporter)
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
    })

    // @ts-expect-error
    expect(tel.rootContext?.getValue(Symbol.for('OpenTelemetry Context Key SPAN'))._spanContext.spanId).to.equal('4ad8bd26672a01b0')

    tel.setRootContext({ context: { traceparent: '00-a14c8519972996a2a0748f2c8db5a775-4ad8bd26672a01b1-01' } })

    // @ts-expect-error
    expect(tel.rootContext?.getValue(Symbol.for('OpenTelemetry Context Key SPAN'))._spanContext.spanId).to.equal('4ad8bd26672a01b1')
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
    })

    // @ts-expect-error
    expect(tel.rootContext?.getValue(Symbol.for('OpenTelemetry Context Key SPAN'))._spanContext.spanId).to.equal('4ad8bd26672a01b0')

    tel.setRootContext()

    // @ts-expect-error
    expect(tel.rootContext?.getValue(Symbol.for('OpenTelemetry Context Key SPAN'))._spanContext.spanId).to.equal('4ad8bd26672a01b0')

    tel.setRootContext({})

    // @ts-expect-error
    expect(tel.rootContext?.getValue(Symbol.for('OpenTelemetry Context Key SPAN'))._spanContext.spanId).to.equal('4ad8bd26672a01b0')
  })
})
