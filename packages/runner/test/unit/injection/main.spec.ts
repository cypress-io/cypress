import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { calls, timers } = vi.hoisted(() => {
  const calls: string[] = []

  return {
    calls,
    timers: {
      reset: vi.fn(),
      pause: vi.fn(),
      wrap: vi.fn(() => calls.push('timers.wrap')),
    },
  }
})

vi.mock('../../../injection/timers', () => {
  return {
    createTimers: vi.fn(() => {
      calls.push('createTimers')

      return timers
    }),
  }
})

vi.mock('../../../injection/patches/xmlHttpRequest', () => {
  return {
    patchXmlHttpRequest: vi.fn((win) => {
      calls.push(`patchXmlHttpRequest:${win === window}`)
    }),
  }
})

vi.mock('../../../injection/patches/integrity', () => {
  return {
    patchElementIntegrity: vi.fn((win) => {
      calls.push(`patchElementIntegrity:${win === window}`)
    }),
  }
})

const MISSING_CYPRESS_MESSAGE = 'Something went terribly wrong and we cannot proceed. We expected to find the global Cypress in the parent window but it is missing. This should never happen and likely is a bug. Please open an issue.'

// Stands in for the driver's Cypress, which has the event emitter mixed in,
// recording each call so the spec can assert the order they happen in.
const createParentCypress = (config: Record<string, unknown>) => {
  return {
    config: vi.fn((key: string) => config[key]),
    on: vi.fn((event: string, handler: unknown) => {
      calls.push(`on:${event}:${handler === timers.reset ? 'reset' : handler === timers.pause ? 'pause' : 'other'}`)
    }),
    removeAllListeners: vi.fn((event: string) => {
      calls.push(`removeAllListeners:${event}`)
    }),
    action: vi.fn((event: string, win: unknown) => {
      calls.push(`action:${event}:${win === window}`)
    }),
  }
}

const loadInjection = () => import('../../../injection/main')

describe('injection/main', () => {
  beforeEach(() => {
    vi.resetModules()
    calls.length = 0
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    Reflect.deleteProperty(window, 'Cypress')
  })

  describe('with Cypress on the parent window', () => {
    it('runs the startup steps in order, announcing the window last', async () => {
      vi.stubGlobal('parent', { Cypress: createParentCypress({ removeSRIAttributes: true }) })

      await loadInjection()

      expect(calls).toEqual([
        'patchXmlHttpRequest:true',
        'patchElementIntegrity:true',
        'createTimers',
        'removeAllListeners:app:timers:reset',
        'removeAllListeners:app:timers:pause',
        'on:app:timers:reset:reset',
        'on:app:timers:pause:pause',
        'timers.wrap',
        'action:app:window:before:load:true',
      ])
    })

    it('exposes the parent window\'s Cypress on the AUT window', async () => {
      const Cypress = createParentCypress({ removeSRIAttributes: false })

      vi.stubGlobal('parent', { Cypress })

      await loadInjection()

      expect(window.Cypress).toBe(Cypress)
    })

    it('leaves the integrity attribute alone when removeSRIAttributes is false', async () => {
      const Cypress = createParentCypress({ removeSRIAttributes: false })

      vi.stubGlobal('parent', { Cypress })

      await loadInjection()

      expect(Cypress.config).toHaveBeenCalledWith('removeSRIAttributes')
      expect(calls).not.toContain('patchElementIntegrity:true')
      expect(calls).toContain('patchXmlHttpRequest:true')
    })

    // The parent's Cypress outlives each AUT page load, so without this the
    // handlers from earlier pages would keep driving their stale timers.
    it('replaces the timer listeners left by an earlier page load', async () => {
      const Cypress = createParentCypress({ removeSRIAttributes: false })

      vi.stubGlobal('parent', { Cypress })

      await loadInjection()
      vi.resetModules()
      await loadInjection()

      expect(Cypress.removeAllListeners).toHaveBeenCalledTimes(4)
      expect(Cypress.on).toHaveBeenCalledTimes(4)

      const secondLoad = calls.slice(calls.lastIndexOf('createTimers'))

      expect(secondLoad.indexOf('removeAllListeners:app:timers:reset')).toBeLessThan(secondLoad.indexOf('on:app:timers:reset:reset'))
      expect(secondLoad.indexOf('removeAllListeners:app:timers:pause')).toBeLessThan(secondLoad.indexOf('on:app:timers:pause:pause'))
    })
  })

  describe('without a usable Cypress on the parent window', () => {
    it('throws before patching anything when Cypress is missing', async () => {
      vi.stubGlobal('parent', {})

      await expect(loadInjection()).rejects.toThrow(MISSING_CYPRESS_MESSAGE)
      expect(calls).toEqual([])
      expect(window.Cypress).toBeUndefined()
    })

    it('throws before patching anything when Cypress lacks the driver\'s event emitter', async () => {
      vi.stubGlobal('parent', {
        Cypress: {
          config: vi.fn(() => false),
          action: vi.fn(),
        },
      })

      await expect(loadInjection()).rejects.toThrow(MISSING_CYPRESS_MESSAGE)
      expect(calls).toEqual([])
      expect(window.Cypress).toBeUndefined()
    })
  })
})
