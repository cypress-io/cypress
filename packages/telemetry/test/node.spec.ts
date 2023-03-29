import { expect } from 'chai'

import { telemetry } from '../src/node'
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
      expect(telemetry.getActiveContextObject().traceparent).to.be.undefined
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

      expect(telemetry.getActiveContextObject().traceparent).to.be.undefined
    })
  })

  describe('getActiveContextObject', () => {
    it('returns an empty object', () => {
      const spanny = telemetry.startSpan({ name: 'active', active: true })

      expect(telemetry.getActiveContextObject().traceparent).to.exist
      spanny?.end()
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
})
