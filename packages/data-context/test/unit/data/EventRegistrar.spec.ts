import { describe, expect, it, beforeEach, jest } from '@jest/globals'
import { EventRegistrar } from '../../../src/data/EventRegistrar'

let registrar: EventRegistrar

describe('EventRegistrar', () => {
  beforeEach(() => {
    registrar = new EventRegistrar()
  })

  describe('#registerEvent', () => {
    it('registers a callback for an event', () => {
      registrar.registerEvent('foo', jest.fn())

      expect(registrar.hasNodeEvent('foo')).toBe(true)
    })

    it('throws if event is not a string', () => {
      // @ts-expect-error
      expect(() => registrar.registerEvent(false, () => {}))
      .toThrow(`The plugin register function must be called with an event as its 1st argument. You passed 'false'.`)
    })

    it('throws if callback is not a function', () => {
      // @ts-expect-error
      expect(() => registrar.registerEvent('foo', false))
      .toThrow(`The plugin register function must be called with a callback function as its 2nd argument. You passed 'false'.`)
    })
  })

  describe('#executeNodeEvent', () => {
    it('spreads the args array into the registered callback', () => {
      const callback = jest.fn(() => 'result')

      registrar.registerEvent('foo', callback)

      expect(registrar.executeNodeEvent('foo', ['arg1', 'arg2'])).toBe('result')
      expect(callback).toHaveBeenCalledWith('arg1', 'arg2')
    })

    it('throws when the event has not been registered', () => {
      expect(() => registrar.executeNodeEvent('foo', [])).toThrow('Missing event for foo')
    })
  })
})
