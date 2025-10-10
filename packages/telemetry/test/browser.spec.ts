// @ts-expect-error
global.window = {}

import { describe, it, expect, beforeAll } from 'vitest'
import { telemetry } from '../src/client'
import { Telemetry as TelemetryClass } from '../src/telemetry/index'

describe('telemetry is disabled', () => {
  describe('init', () => {
    it('does not throw', () => {
      expect(() => {
        telemetry.init({
          namespace: 'namespace',
          config: { version: 'version' },
        })
      }).not.toThrow()

      expect(window.cypressTelemetrySingleton).toBeUndefined()
    })
  })

  describe('attach', () => {
    it('returns void', () => {
      expect(() => telemetry.attach()).not.toThrow()
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

  describe('shutdown', () => {
    it('does not throw', () => {
      expect(() => telemetry.shutdown()).not.toThrow()
    })
  })

  describe('attachWebSocket', () => {
    it('does not throw', () => {
      expect(() => telemetry.attachWebSocket('s')).not.toThrow()
    })
  })

  describe('setRootContext', () => {
    it('does not throw', () => {
      expect(() => telemetry.setRootContext()).not.toThrow()
    })
  })
})

describe('telemetry is enabled', () => {
  beforeAll(() => {
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

    expect(() => {
      telemetry.init({
        namespace: 'namespace',
        config: { version: 'version' },
      })
    }).not.toThrow()

    expect(window.cypressTelemetrySingleton).toBeInstanceOf(TelemetryClass)
    expect(window.cypressTelemetrySingleton.getResources()).toEqual(expect.objectContaining({ herp: 'derp' }))
  })

  describe('attachWebSocket', () => {
    it('returns true', () => {
      telemetry.attachWebSocket('ws')

      expect(window.cypressTelemetrySingleton?.getExporter()?.ws).toEqual('ws')
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

  describe('shutdown', () => {
    it('does not throw', () => {
      expect(() => telemetry.shutdown()).not.toThrow()
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
        expect(err).toEqual('Telemetry instance has already be initialized')

        return
      }

      throw 'should not be called'
    })
  })

  describe('setRootContext', () => {
    it('it sets the context', () => {
      // @ts-expect-error
      expect(window.cypressTelemetrySingleton?.rootContext?.getValue(Symbol.for('OpenTelemetry Context Key SPAN'))._spanContext.spanId).toEqual('4ad8bd26672a01b0')

      telemetry.setRootContext({ context: { traceparent: '00-a14c8519972996a2a0748f2c8db5a775-4ad8bd26672a01b1-01' } })

      // @ts-expect-error
      expect(window.cypressTelemetrySingleton?.rootContext?.getValue(Symbol.for('OpenTelemetry Context Key SPAN'))._spanContext.spanId).toEqual('4ad8bd26672a01b1')
    })
  })
})
