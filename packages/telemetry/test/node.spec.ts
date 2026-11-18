import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import { telemetry, encodeTelemetryContext, decodeTelemetryContext } from '../src/node'
import { OTLPTraceExporter as OTLPTraceExporterCloud } from '../src/span-exporters/cloud-span-exporter'
import { REDACTED } from '../src/detectors/processDetectorSync'

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
  const argv = process.argv

  beforeAll(() => {
    vi.stubEnv('CYPRESS_INTERNAL_ENABLE_TELEMETRY', 'true')
    process.argv = [...argv, '--key', 'record-key-value']
    const exporter = new OTLPTraceExporterCloud()

    expect(() => {
      telemetry.init({
        namespace: 'namespace',
        version: 'version',
        exporter,
      })
    }).not.toThrow()
  })

  afterAll(() => {
    process.argv = argv
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

  describe('getResources', () => {
    it('does not include the record key from the command line', () => {
      const resources = telemetry.getResources()

      expect(resources[SemanticResourceAttributes.PROCESS_COMMAND_ARGS]).toEqual(expect.arrayContaining(['--key', REDACTED]))
      expect(JSON.stringify(resources)).not.toContain('record-key-value')
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
