import { describe, it, expect, vi } from 'vitest'
import { trace } from '@opentelemetry/api'
import { Telemetry } from '../src/telemetry'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import { BatchSpanProcessor, Span as SdkSpan } from '@opentelemetry/sdk-trace-base'

import type { Span } from '@opentelemetry/api'

import { OTLPTraceExporter as OTLPTraceExporterCloud } from '../src/span-exporters/cloud-span-exporter'

// Telemetry returns the Span API interface, which omits the name and parentSpanId the SDK span carries
function assertSdkSpan (span: Span | undefined): asserts span is SdkSpan {
  expect(span).toBeInstanceOf(SdkSpan)
}

const rootSpanId = (tel: Telemetry) => tel.rootContext && trace.getSpanContext(tel.rootContext)?.spanId

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
    // @ts-expect-error - _spanProcessors is internal to the SDK's MultiSpanProcessor
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

    assertSdkSpan(span)
    expect(span.name).toEqual('span')
    expect(span.parentSpanId).toEqual('4ad8bd26672a01b0')
    expect(tel.activeSpanQueue.length).toBeLessThan(1)
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

    assertSdkSpan(span)
    expect(span.name).toEqual('span')
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

    assertSdkSpan(span)
    expect(span.name).toEqual('span')
    expect(span.parentSpanId).toEqual(parentSpan.spanContext().spanId)
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

    assertSdkSpan(span)
    expect(span.name).toEqual('span')
    expect(span.parentSpanId).toBeUndefined()
    const [activeSpan] = tel.activeSpanQueue

    assertSdkSpan(activeSpan)
    expect(activeSpan.name).toEqual('span')

    // Start a child that should have the previous span as a parent
    const spanChild = tel.startSpan({ name: 'child' })

    assertSdkSpan(spanChild)
    expect(spanChild.name).toEqual('child')
    expect(spanChild.parentSpanId).toEqual(span.spanContext().spanId)

    // Start a root child that does not have the active parent
    const spanRoot = tel.startSpan({ name: 'root', attachType: 'root' })

    assertSdkSpan(spanRoot)
    expect(spanRoot.name).toEqual('root')
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

    assertSdkSpan(retrievedSpan)
    expect(retrievedSpan.name).toEqual('span')
    expect(retrievedSpan.spanContext().spanId).toEqual(span.spanContext().spanId)
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
      // @ts-expect-error - a bare traceparent does not match the contextObject shape
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

  it('merges ancestor attributes into the active span, preferring the ancestor and dropping name', () => {
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

    tel.startSpan({ name: 'grandparent', active: true })?.setAttributes({ grandparent: 'yes', shared: 'grandparent' })
    tel.startSpan({ name: 'parent', active: true })?.setAttributes({ parent: 'yes', shared: 'parent' })
    tel.startSpan({ name: 'child', active: true })?.setAttributes({ child: 'yes', shared: 'child', name: 'child' })

    expect(tel.getActiveContextObject().attributes).toEqual({
      grandparent: 'yes',
      parent: 'yes',
      child: 'yes',
      shared: 'grandparent',
    })
  })
})

describe('span end', () => {
  it('copies the attributes of its ancestors onto the span', () => {
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

    const grandparent = tel.startSpan({ name: 'grandparent' })

    grandparent?.setAttributes({ grandparent: 'yes' })

    const parent = tel.startSpan({ name: 'parent', parentSpan: grandparent })

    parent?.setAttributes({ parent: 'yes' })

    const child = tel.startSpan({ name: 'child', parentSpan: parent })

    assertSdkSpan(child)
    child.setAttributes({ child: 'yes' })
    child.end()

    expect(child.attributes).toEqual({ grandparent: 'yes', parent: 'yes', child: 'yes' })
  })

  it('does not copy attributes from a parent it did not start', () => {
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

    const external = tel.tracer.startSpan('external', { attributes: { external: 'yes' } })
    const child = tel.startSpan({ name: 'child', parentSpan: external })

    assertSdkSpan(child)
    child.end()

    expect(child.attributes).toEqual({})
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
      // @ts-expect-error - a bare traceparent does not match the contextObject shape
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
      // @ts-expect-error - a bare traceparent does not match the contextObject shape
      rootContextObject: { traceparent: 'id' },
      SpanProcessor: BatchSpanProcessor,
      isVerbose: false,
    })

    const shutdown = vi.spyOn(tel.provider, 'shutdown').mockResolvedValue()

    await tel.shutdown()

    expect(shutdown).toHaveBeenCalled()
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
      // @ts-expect-error - a bare traceparent does not match the contextObject shape
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

    expect(rootSpanId(tel)).toEqual('4ad8bd26672a01b0')

    tel.setRootContext({ context: { traceparent: '00-a14c8519972996a2a0748f2c8db5a775-4ad8bd26672a01b1-01' } })

    expect(rootSpanId(tel)).toEqual('4ad8bd26672a01b1')
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

    expect(rootSpanId(tel)).toEqual('4ad8bd26672a01b0')

    tel.setRootContext()

    expect(rootSpanId(tel)).toEqual('4ad8bd26672a01b0')

    tel.setRootContext({})

    expect(rootSpanId(tel)).toEqual('4ad8bd26672a01b0')
  })
})
