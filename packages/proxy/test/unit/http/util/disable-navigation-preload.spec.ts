import { describe, expect, it, vi } from 'vitest'
import { DISABLE_NAVIGATION_PRELOAD_EXPRESSION, DISABLE_NAVIGATION_PRELOAD_WINDOW_EXPRESSION } from '../../../../lib/http/util/disable-navigation-preload'

// Runs an injected expression the same way Runtime.evaluate / a prepended
// script body / addScriptToEvaluateOnNewDocument does: as a standalone
// script with a single free variable naming its realm.
function evaluate (expression: string, freeVariableName: string, value: unknown) {
  // eslint-disable-next-line no-new-func
  return new Function(freeVariableName, expression)(value)
}

// A microtask-only flush never gives `process` a chance to decide a rejected
// promise went unhandled — Node only makes that decision on a later turn of
// the event loop, so the check needs an actual macrotask.
async function flush () {
  await new Promise((resolve) => setImmediate(resolve))
}

describe('lib/http/util/disable-navigation-preload', () => {
  describe('DISABLE_NAVIGATION_PRELOAD_EXPRESSION (worker realm)', () => {
    // A prototype-backed fake so patches can be told apart from an instance's
    // own properties, the same shape the real NavigationPreloadManager has.
    function createManagerClass (methods: { enable?: Function, disable?: Function }) {
      function FakeNavigationPreloadManager (this: any) {}

      if (methods.enable) {
        FakeNavigationPreloadManager.prototype.enable = methods.enable
      }

      if (methods.disable) {
        FakeNavigationPreloadManager.prototype.disable = methods.disable
      }

      return FakeNavigationPreloadManager
    }

    function evaluateWorker (fakeSelf: unknown) {
      return evaluate(DISABLE_NAVIGATION_PRELOAD_EXPRESSION, 'self', fakeSelf)
    }

    it('replaces enable with a resolving no-op on the prototype', async () => {
      const originalEnable = vi.fn().mockRejectedValue(new Error('original enable should not be called'))
      const Manager = createManagerClass({ enable: originalEnable, disable: vi.fn().mockResolvedValue(undefined) })
      const preload = new (Manager as any)()

      evaluateWorker({ registration: { navigationPreload: preload } })

      expect(Manager.prototype.enable).not.toBe(originalEnable)
      await expect(preload.enable()).resolves.toBeUndefined()
      expect(originalEnable).not.toHaveBeenCalled()
    })

    it('calls disable() once', () => {
      const disable = vi.fn().mockResolvedValue(undefined)
      const Manager = createManagerClass({ enable: vi.fn().mockResolvedValue(undefined), disable })
      const preload = new (Manager as any)()

      evaluateWorker({ registration: { navigationPreload: preload } })

      expect(disable).toHaveBeenCalledOnce()
    })

    it('swallows a disable() rejection', async () => {
      const Manager = createManagerClass({
        enable: vi.fn().mockResolvedValue(undefined),
        // A plain rejecting function, not a vi.fn mock: vitest's own mock
        // wrapper observes a mocked rejection for its `mock.results`
        // bookkeeping, which makes Node treat it as handled regardless of
        // whether the code under test ever attaches a .catch — defeating
        // this exact check.
        disable: () => Promise.reject(new Error('InvalidStateError')),
      })
      const preload = new (Manager as any)()
      const unhandled = vi.fn()

      process.on('unhandledRejection', unhandled)

      try {
        evaluateWorker({ registration: { navigationPreload: preload } })

        await flush()

        expect(unhandled).not.toHaveBeenCalled()
      } finally {
        process.removeListener('unhandledRejection', unhandled)
      }
    })

    it('is inert when self.registration is missing', () => {
      expect(() => evaluateWorker({})).not.toThrow()
    })

    it('is inert when navigationPreload is missing', () => {
      expect(() => evaluateWorker({ registration: {} })).not.toThrow()
    })

    it('patches the instance when the prototype has no enable of its own', async () => {
      const Manager = createManagerClass({ disable: vi.fn().mockResolvedValue(undefined) })
      const preload = new (Manager as any)()
      const ownEnable = vi.fn().mockRejectedValue(new Error('own enable should not be called'))

      preload.enable = ownEnable

      evaluateWorker({ registration: { navigationPreload: preload } })

      expect(preload.enable).not.toBe(ownEnable)
      expect(Manager.prototype).not.toHaveProperty('enable')
      await expect(preload.enable()).resolves.toBeUndefined()
    })
  })

  describe('DISABLE_NAVIGATION_PRELOAD_WINDOW_EXPRESSION (window realm)', () => {
    function createManagerCtor (enable?: Function) {
      function FakeNavigationPreloadManager (this: any) {}

      FakeNavigationPreloadManager.prototype.enable = enable ?? vi.fn().mockResolvedValue(undefined)

      return FakeNavigationPreloadManager
    }

    function createFakeSelf (options: {
      NavigationPreloadManager?: Function
      getRegistrations?: Function
    } = {}) {
      return {
        NavigationPreloadManager: options.NavigationPreloadManager,
        navigator: options.getRegistrations ? { serviceWorker: { getRegistrations: options.getRegistrations } } : undefined,
      }
    }

    function evaluateWindow (fakeSelf: unknown) {
      return evaluate(DISABLE_NAVIGATION_PRELOAD_WINDOW_EXPRESSION, 'self', fakeSelf)
    }

    it('replaces NavigationPreloadManager.prototype.enable with a resolving no-op', async () => {
      const originalEnable = vi.fn().mockRejectedValue(new Error('original enable should not be called'))
      const Ctor = createManagerCtor(originalEnable)

      evaluateWindow(createFakeSelf({ NavigationPreloadManager: Ctor }))

      expect(Ctor.prototype.enable).not.toBe(originalEnable)
      await expect(new (Ctor as any)().enable()).resolves.toBeUndefined()
      expect(originalEnable).not.toHaveBeenCalled()
    })

    it('is inert when NavigationPreloadManager is absent', () => {
      expect(() => evaluateWindow(createFakeSelf())).not.toThrow()
    })

    it('is inert when navigator.serviceWorker is absent', () => {
      expect(() => evaluateWindow(createFakeSelf({ NavigationPreloadManager: createManagerCtor() }))).not.toThrow()
    })

    it('calls disable() once per registration returned by getRegistrations()', async () => {
      const disableA = vi.fn().mockResolvedValue(undefined)
      const disableB = vi.fn().mockResolvedValue(undefined)
      const getRegistrations = vi.fn().mockResolvedValue([
        { navigationPreload: { disable: disableA } },
        { navigationPreload: { disable: disableB } },
      ])

      evaluateWindow(createFakeSelf({ NavigationPreloadManager: createManagerCtor(), getRegistrations }))

      await flush()

      expect(disableA).toHaveBeenCalledOnce()
      expect(disableB).toHaveBeenCalledOnce()
    })

    it('swallows a disable() rejection from a persisted registration', async () => {
      // Plain rejecting function, not a vi.fn mock — see the worker-realm
      // test above for why a mocked rejection can't exercise this check.
      const getRegistrations = () => {
        return Promise.resolve([
          { navigationPreload: { disable: () => Promise.reject(new Error('InvalidStateError')) } },
        ])
      }
      const unhandled = vi.fn()

      process.on('unhandledRejection', unhandled)

      try {
        evaluateWindow(createFakeSelf({ NavigationPreloadManager: createManagerCtor(), getRegistrations }))

        await flush()

        expect(unhandled).not.toHaveBeenCalled()
      } finally {
        process.removeListener('unhandledRejection', unhandled)
      }
    })

    it('swallows a getRegistrations() rejection', async () => {
      const getRegistrations = () => Promise.reject(new Error('boom'))
      const unhandled = vi.fn()

      process.on('unhandledRejection', unhandled)

      try {
        evaluateWindow(createFakeSelf({ NavigationPreloadManager: createManagerCtor(), getRegistrations }))

        await flush()

        expect(unhandled).not.toHaveBeenCalled()
      } finally {
        process.removeListener('unhandledRejection', unhandled)
      }
    })

    it('is inert when NavigationPreloadManager.prototype.enable is not a function', () => {
      function Ctor (this: any) {}
      Ctor.prototype.enable = 'not a function'

      expect(() => evaluateWindow(createFakeSelf({ NavigationPreloadManager: Ctor }))).not.toThrow()
      expect(Ctor.prototype.enable).toBe('not a function')
    })

    it('is inert when NavigationPreloadManager has no prototype', () => {
      // An arrow function has no `.prototype` of its own (unlike a function
      // declaration, whose `.prototype` is non-configurable and can't be
      // deleted) — the production type declares `prototype` optional
      // precisely to be honest about the guard needing to handle this.
      const ctorWithoutPrototype = () => {}

      expect(() => evaluateWindow(createFakeSelf({ NavigationPreloadManager: ctorWithoutPrototype }))).not.toThrow()
    })

    it('skips a registration missing navigationPreload without throwing, and still disables the others', async () => {
      const disable = vi.fn().mockResolvedValue(undefined)
      const getRegistrations = vi.fn().mockResolvedValue([
        { /* no navigationPreload — e.g. a registration whose worker never called register() on this scope */ },
        { navigationPreload: { disable } },
      ])

      expect(() => evaluateWindow(createFakeSelf({ NavigationPreloadManager: createManagerCtor(), getRegistrations }))).not.toThrow()

      await flush()

      expect(disable).toHaveBeenCalledOnce()
    })
  })
})
