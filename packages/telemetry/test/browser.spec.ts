// @ts-expect-error
global.window = {}

import { expect } from 'chai'

import { telemetry } from '../src/browser'

import { Telemetry as TelemetryClass } from '../src/index'

describe('telemetry is disabled', () => {
  describe('init', () => {
    it('does not throw', () => {
      expect(telemetry.init({
        namespace: 'namespace',
        config: { version: 'version' },
      })).to.not.throw

      expect(window.cypressTelemetrySingleton).to.be.undefined
    })
  })

  describe('attach', () => {
    it('returns void', () => {
      expect(telemetry.attach()).to.not.throw
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

  describe('shutdown', () => {
    it('does not throw', () => {
      expect(telemetry.shutdown()).to.not.throw
    })
  })

  describe('attachWebSocket', () => {
    it('does not throw', () => {
      expect(telemetry.attachWebSocket('s')).to.not.throw
    })
  })

  describe('setRootContext', () => {
    it('does not throw', () => {
      expect(telemetry.setRootContext()).to.not.throw
    })
  })
})

describe('telemetry is enabled', () => {
  before('init', () => {
    // @ts-expect-error
    global.window.__CYPRESS_TELEMETRY__ = {
      context: {
        context: {
          traceparent: '00-a14c8519972996a2a0748f2c8db5a775-4ad8bd26672a01b0-01',
        },
      },
      resources: {
        herp: 'derp',
      },
      isVerbose: false,
    }

    expect(telemetry.init({
      namespace: 'namespace',
      config: { version: 'version' },
    })).to.not.throw

    expect(window.cypressTelemetrySingleton).to.be.instanceOf(TelemetryClass)
    expect(window.cypressTelemetrySingleton.getResources()).to.contain({ herp: 'derp' })
  })

  describe('attachWebSocket', () => {
    it('returns true', () => {
      telemetry.attachWebSocket('ws')

      expect(window.cypressTelemetrySingleton?.getExporter()?.ws).to.equal('ws')
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

  describe('shutdown', () => {
    it('does not throw', () => {
      expect(telemetry.shutdown()).to.not.throw
    })
  })

  describe('init', () => {
    it('throws if called more than once', () => {
      try {
        telemetry.init({
          namespace: 'namespace',
          config: { version: 'version' },
        })
      } catch (err) {
        expect(err).to.equal('Telemetry instance has already be initialized')
      }
    })
  })

  describe('setRootContext', () => {
    it('it sets the context', () => {
      // @ts-expect-error
      expect(window.cypressTelemetrySingleton?.rootContext?.getValue(Symbol.for('OpenTelemetry Context Key SPAN'))._spanContext.spanId).to.equal('4ad8bd26672a01b0')

      telemetry.setRootContext({ context: { traceparent: '00-a14c8519972996a2a0748f2c8db5a775-4ad8bd26672a01b1-01' } })

      // @ts-expect-error
      expect(window.cypressTelemetrySingleton?.rootContext?.getValue(Symbol.for('OpenTelemetry Context Key SPAN'))._spanContext.spanId).to.equal('4ad8bd26672a01b1')
    })
  })
})
