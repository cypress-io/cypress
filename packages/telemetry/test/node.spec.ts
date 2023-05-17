import { expect } from 'chai'

import { telemetry, encodeTelemetryContext, decodeTelemetryContext } from '../src/node'
import { OTLPTraceExporter as OTLPTraceExporterCloud } from '../src/span-exporters/cloud-span-exporter'

describe('telemetry is disabled', () => {
  describe('init', () => {
    it('does not throw', () => {
      const exporter = new OTLPTraceExporterCloud()

      expect(telemetry.init({
        namespace: 'namespace',
        version: 'version',
        exporter,
      })).to.not.throw
    })
  })

  describe('isEnabled', () => {
    it('returns false', () => {
      expect(telemetry.isEnabled()).to.be.false
    })
  })

  describe('startSpan', () => {
    it('returns undefined', () => {
      expect(telemetry.startSpan({ name: 'nope' })).to.be.undefined
    })
  })

  describe('getSpan', () => {
    it('returns undefined', () => {
      expect(telemetry.getSpan('nope')).to.be.undefined
    })
  })

  describe('findActiveSpan', () => {
    it('returns undefined', () => {
      expect(telemetry.findActiveSpan((span) => true)).to.be.undefined
    })
  })

  describe('endActiveSpanAndChildren', () => {
    it('does not throw', () => {
      const spanny = telemetry.startSpan({ name: 'active', active: true })

      expect(telemetry.endActiveSpanAndChildren(spanny)).to.not.throw
    })
  })

  describe('getActiveContextObject', () => {
    it('returns an empty object', () => {
      expect(telemetry.getActiveContextObject().context).to.be.undefined
    })
  })

  describe('getResources', () => {
    it('returns an empty object', () => {
      expect(telemetry.getResources()).to.not.be.undefined
    })
  })

  describe('shutdown', () => {
    it('does not throw', () => {
      expect(telemetry.shutdown()).to.not.throw
    })
  })

  describe('exporter', () => {
    it('returns undefined', () => {
      expect(telemetry.exporter()).to.be.undefined
    })
  })
})

describe('telemetry is enabled', () => {
  before('init', () => {
    process.env.CYPRESS_INTERNAL_ENABLE_TELEMETRY = 'true'
    const exporter = new OTLPTraceExporterCloud()

    expect(telemetry.init({
      namespace: 'namespace',
      version: 'version',
      exporter,
    })).to.not.throw
  })

  describe('isEnabled', () => {
    it('returns true', () => {
      expect(telemetry.isEnabled()).to.be.true
    })
  })

  describe('startSpan', () => {
    it('returns undefined', () => {
      expect(telemetry.startSpan({ name: 'nope' })).to.exist
    })
  })

  describe('getSpan', () => {
    it('returns undefined', () => {
      telemetry.startSpan({ name: 'nope' })
      expect(telemetry.getSpan('nope')).to.be.exist
    })
  })

  describe('findActiveSpan', () => {
    it('returns undefined', () => {
      const spanny = telemetry.startSpan({ name: 'active', active: true })

      expect(telemetry.findActiveSpan((span) => true)).to.be.exist
      spanny?.end()
    })
  })

  describe('endActiveSpanAndChildren', () => {
    it('does not throw', () => {
      const spanny = telemetry.startSpan({ name: 'active', active: true })

      expect(telemetry.endActiveSpanAndChildren(spanny)).to.not.throw

      expect(telemetry.getActiveContextObject().context).to.be.undefined
    })
  })

  describe('getActiveContextObject', () => {
    it('returns an empty object', () => {
      const spanny = telemetry.startSpan({ name: 'active', active: true })

      expect(telemetry.getActiveContextObject().context.traceparent).to.exist
      spanny?.end()
    })
  })

  describe('getResources', () => {
    it('returns an empty object', () => {
      expect(telemetry.getResources()).to.include({
        'service.name': 'cypress-app',
        'telemetry.sdk.language': 'nodejs',
        'telemetry.sdk.name': 'opentelemetry',
        'service.namespace': 'namespace',
        'service.version': 'version',
      })
    })
  })

  describe('shutdown', () => {
    it('does not throw', () => {
      expect(telemetry.shutdown()).to.not.throw
    })
  })

  describe('exporter', () => {
    it('returns undefined', () => {
      expect(telemetry.exporter()).to.exist
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
        expect(err).to.equal('Telemetry instance has already be initialized')
      }
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

    expect(decodedContext.context.context.traceparent).to.equal(context.context.context.traceparent)
    expect(decodedContext.version).to.equal(context.version)
  })

  it('it does not throw if passed an empty context', () => {
    const context = {
    }

    const decodedContext = decodeTelemetryContext(encodeTelemetryContext(context))

    expect(decodedContext.context).to.be.undefined
    expect(decodedContext.version).to.be.undefined
  })
})
