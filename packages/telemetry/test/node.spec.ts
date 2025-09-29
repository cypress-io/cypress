import { describe, it, expect, beforeAll, vi } from 'vitest'
import { telemetry, encodeTelemetryContext, decodeTelemetryContext } from '../src/node'
import { OTLPTraceExporter as OTLPTraceExporterCloud } from '../src/span-exporters/cloud-span-exporter'

// stub out the otlp exporter so we don't send requests to localhost:4318
vi.mock('@opentelemetry/exporter-trace-otlp-http')

describe('telemetry is disabled', () => {
  describe('init', () => {
    it('does not throw', () => {
      const exporter = new OTLPTraceExporterCloud()

      expect(() => {
        telemetry.init({
          namespace: 'namespace',
          version: 'version',
          exporter,
        })
      }).not.toThrow()
    })
  })

  describe('isEnabled', () => {
    it('returns false', () => {
      expect(telemetry.isEnabled()).toBe(false)
    })
  })

  describe('startSpan', () => {
    it('returns undefined', () => {
      expect(telemetry.startSpan({ name: 'nope' })).toBeUndefined()
    })
  })

  describe('getSpan', () => {
    it('returns undefined', () => {
      expect(telemetry.getSpan('nope')).toBeUndefined()
    })
  })

  describe('findActiveSpan', () => {
    it('returns undefined', () => {
      expect(telemetry.findActiveSpan((span) => true)).toBeUndefined()
    })
  })

  describe('endActiveSpanAndChildren', () => {
    it('does not throw', () => {
      const spanny = telemetry.startSpan({ name: 'active', active: true })

      expect(() => telemetry.endActiveSpanAndChildren(spanny)).not.toThrow()
    })
  })

  describe('getActiveContextObject', () => {
    it('returns an empty object', () => {
      expect(telemetry.getActiveContextObject().context).toBeUndefined()
    })
  })

  describe('getResources', () => {
    it('returns an empty object', () => {
      expect(telemetry.getResources()).toBeDefined()
    })
  })

  describe('shutdown', () => {
    it('does not throw', () => {
      expect(() => telemetry.shutdown()).not.toThrow()
    })
  })

  describe('exporter', () => {
    it('returns undefined', () => {
      expect(telemetry.exporter()).toBeUndefined()
    })
  })
})

describe('telemetry is enabled', () => {
  beforeAll(() => {
    vi.stubEnv('CYPRESS_INTERNAL_ENABLE_TELEMETRY', 'true')
    const exporter = new OTLPTraceExporterCloud()

    expect(() => {
      telemetry.init({
        namespace: 'namespace',
        version: 'version',
        exporter,
      })
    }).not.toThrow()
  })

  describe('isEnabled', () => {
    it('returns true', () => {
      expect(telemetry.isEnabled()).toBe(true)
    })
  })

  describe('startSpan', () => {
    it('returns undefined', () => {
      expect(telemetry.startSpan({ name: 'nope' })).toBeDefined()
    })
  })

  describe('getSpan', () => {
    it('returns undefined', () => {
      telemetry.startSpan({ name: 'nope' })
      expect(telemetry.getSpan('nope')).toBeDefined()
    })
  })

  describe('findActiveSpan', () => {
    it('returns undefined', () => {
      const spanny = telemetry.startSpan({ name: 'active', active: true })

      expect(telemetry.findActiveSpan((span) => true)).toBeDefined()
      spanny?.end()
    })
  })

  describe('endActiveSpanAndChildren', () => {
    it('does not throw', () => {
      const spanny = telemetry.startSpan({ name: 'active', active: true })

      expect(() => telemetry.endActiveSpanAndChildren(spanny)).not.toThrow()

      expect(telemetry.getActiveContextObject().context).toBeUndefined()
    })
  })

  describe('getActiveContextObject', () => {
    it('returns an empty object', () => {
      const spanny = telemetry.startSpan({ name: 'active', active: true })

      expect(telemetry.getActiveContextObject().context.traceparent).toBeDefined()
      spanny?.end()
    })
  })

  describe('getResources', () => {
    it('returns an empty object', () => {
      expect(telemetry.getResources()).toEqual(expect.objectContaining({
        'service.name': 'cypress-app',
        'telemetry.sdk.language': 'nodejs',
        'telemetry.sdk.name': 'opentelemetry',
        'service.namespace': 'namespace',
        'service.version': 'version',
      }))
    })
  })

  describe('shutdown', () => {
    it('does not throw', () => {
      expect(() => telemetry.shutdown()).not.toThrow()
    })
  })

  describe('exporter', () => {
    it('returns undefined', () => {
      expect(telemetry.exporter()).toBeDefined()
    })
  })

  describe('init', () => {
    it('throws if called more than once', () => {
      const exporter = new OTLPTraceExporterCloud()

      try {
        telemetry.init({
          namespace: 'namespace',
          version: 'version',
          exporter,
        })
      } catch (err) {
        expect(err).toEqual('Telemetry instance has already be initialized')

        return
      }

      throw 'should not be called'
    })
  })
})

describe('encode/decode', () => {
  it('encodes and decodes telemetry context', () => {
    const context = {
      context: { context: { traceparent: 'abc' } },
      version: '123',
    }

    const decodedContext = decodeTelemetryContext(encodeTelemetryContext(context))

    expect(decodedContext.context.context.traceparent).toEqual(context.context.context.traceparent)
    expect(decodedContext.version).toEqual(context.version)
  })

  it('it does not throw if passed an empty context', () => {
    const context = {
    }

    const decodedContext = decodeTelemetryContext(encodeTelemetryContext(context))

    expect(decodedContext.context).toBeUndefined()
    expect(decodedContext.version).toBeUndefined()
  })
})
