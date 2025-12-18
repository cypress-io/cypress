/**
 * @vitest-environment jsdom
 *
 * Tests for cy.retry fixes that prevent Promise.map from treating failures as successes.
 *
 * Original Bug:
 * 1. When timeout exceeded without error set (e.g., when _runnableTimeout is manipulated in tests),
 *    cy.retry would not throw, causing Promise.map to receive undefined and treat it as success
 * 2. When ended() returned true (promise canceled or runnable changed), cy.retry would return
 *    undefined instead of rejecting, causing Promise.map to treat it as success
 *
 * Fix:
 * 1. Always throw error when timeout exceeded, even if error is not set (handles test scenarios)
 * 2. Reject promise when ended() returns true, instead of returning undefined
 */
import { vi, describe, it, expect, beforeEach, afterEach, MockedObject } from 'vitest'
import Promise from 'bluebird'
import { create } from '../../../src/cy/retries'
import $errUtils from '../../../src/cypress/error_utils'
import type { ICypress } from '../../../src/cypress'
import type { $Cy } from '../../../src/cypress/cy'
import type { StateFunc } from '../../../src/cypress/state'

// Mock error utils
vi.mock('../../../src/cypress/error_utils', () => {
  return {
    default: {
      errByPath: vi.fn((path, options) => {
        return {
          message: `Error: ${path}`,
          name: 'CypressError',
          ...options?.args,
        }
      }),
      throwErr: vi.fn((err) => {
        throw err
      }),
      modifyErrMsg: vi.fn((err, msg) => {
        return { ...err, message: msg + (err?.message || '') }
      }),
      mergeErrProps: vi.fn((err, props) => {
        return { ...err, ...props }
      }),
    },
  }
})

describe('cy/retries', () => {
  let mockCypress: MockedObject<ICypress>
  let mockState: MockedObject<StateFunc>
  let mockTimeout: MockedObject<$Cy['timeout']>
  let mockClearTimeout: MockedObject<$Cy['clearTimeout']>
  let mockWhenStable: MockedObject<$Cy['whenStable']>
  let mockFinishAssertions: MockedObject<(err?: Error) => void>
  let retries: ReturnType<typeof create>

  beforeEach(() => {
    vi.useFakeTimers()

    mockCypress = {
      action: vi.fn(),
    } as any

    const stateMap = new Map()

    mockState = vi.fn((key?: string, value?: any) => {
      if (key && value !== undefined) {
        stateMap.set(key, value)

        return value
      }

      if (key) {
        return stateMap.get(key)
      }

      return stateMap
    }) as any

    mockTimeout = vi.fn(() => 1000) as any
    mockClearTimeout = vi.fn() as any
    mockWhenStable = vi.fn((fn) => Promise.resolve(fn())) as any
    mockFinishAssertions = vi.fn() as any

    retries = create(
      mockCypress,
      mockState,
      mockTimeout,
      mockClearTimeout,
      mockWhenStable,
      mockFinishAssertions,
    )

    // Reset state
    mockState('canceled', false)
    mockState('runnable', { id: 'test-1' })
    mockState('isStable', true)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('timeout handling', () => {
    it('throws error when timeout is exceeded and error is set', () => {
      const fn = vi.fn(() => Promise.resolve('success'))
      const options = {
        timeout: 1000,
        interval: 16,
        log: true,
        error: {
          message: 'Original error',
          name: 'CypressError',
        } as any,
        _runnableTimeout: 0, // Force immediate timeout
        _start: new Date(Date.now() - 100), // Already elapsed
      }

      expect(() => {
        retries.retry(fn, options)
      }).toThrow()

      expect(fn).not.toHaveBeenCalled()
    })

    it('throws error when timeout is exceeded even if error is not set', () => {
      // This test demonstrates the fix: when _runnableTimeout is manipulated (e.g., in tests),
      // cy.retry should still throw even if error is not set yet, preventing Promise.map
      // from treating it as success
      const fn = vi.fn(() => Promise.resolve('success'))
      const options = {
        timeout: 1000,
        interval: 16,
        log: true,
        // error is intentionally not set (simulates test scenario where _runnableTimeout is set to 0)
        _runnableTimeout: 0, // Force immediate timeout
        _start: new Date(Date.now() - 100), // Already elapsed
      }

      expect(() => {
        retries.retry(fn, options)
      }).toThrow()

      expect(fn).not.toHaveBeenCalled()
      expect($errUtils.errByPath).toHaveBeenCalledWith('miscellaneous.retry_timed_out', {
        ms: 0,
      })
    })

    it('prevents Promise.map from treating timeout as success when error is not set', async () => {
      // This test demonstrates the original bug: without the fix, Promise.map
      // would receive undefined and treat it as a successful resolution
      const fn1 = vi.fn(() => Promise.resolve('success1'))
      const fn2 = vi.fn(() => Promise.resolve('success2'))

      const options1 = {
        timeout: 1000,
        interval: 16,
        log: true,
        _runnableTimeout: 100, // Will timeout
        _start: new Date(Date.now() - 200), // Already elapsed
      }

      const options2 = {
        timeout: 1000,
        interval: 16,
        log: true,
        _runnableTimeout: 1000,
        _start: new Date(),
      }

      // First promise should reject due to timeout (even without error set)
      const promise1 = retries.retry(fn1, options1)
      const promise2 = retries.retry(fn2, options2)

      // Promise.map should reject when one promise rejects
      await expect(
        Promise.map([promise1, promise2], (p) => p),
      ).rejects.toThrow()

      expect(fn1).not.toHaveBeenCalled()
    })
  })

  describe('ended() handling', () => {
    it('rejects promise when ended() returns true due to cancellation', async () => {
      // This test demonstrates the fix: previously, when ended() returned true,
      // cy.retry would return undefined, causing Promise.map to treat it as success
      mockState('canceled', true)

      const fn = vi.fn(() => Promise.resolve('success'))
      const options = {
        timeout: 1000,
        interval: 16,
        log: true,
        _runnableTimeout: 1000,
        _start: new Date(),
      }

      const promise = retries.retry(fn, options)

      // Advance timers to trigger the delay
      await vi.advanceTimersByTimeAsync(20)

      // Should reject instead of resolving with undefined
      await expect(promise).rejects.toThrow('Retry ended: promise was canceled or runnable changed')

      expect(fn).not.toHaveBeenCalled()
    })

    it('rejects promise when ended() returns true due to runnable change', async () => {
      mockState('runnable', { id: 'test-2' }) // Different runnable

      const fn = vi.fn(() => Promise.resolve('success'))
      const options = {
        timeout: 1000,
        interval: 16,
        log: true,
        _runnableTimeout: 1000,
        _start: new Date(),
        _runnable: { id: 'test-1' }, // Original runnable
      }

      const promise = retries.retry(fn, options)

      // Advance timers to trigger the delay
      await vi.advanceTimersByTimeAsync(20)

      // Should reject instead of resolving with undefined
      await expect(promise).rejects.toThrow('Retry ended: promise was canceled or runnable changed')

      expect(fn).not.toHaveBeenCalled()
    })

    it('prevents Promise.map from treating ended() as success', async () => {
      // This test demonstrates the original bug: without the fix, when ended()
      // returned true, Promise.map would receive undefined and treat it as success
      mockState('canceled', true)

      const fn1 = vi.fn(() => Promise.resolve('success1'))
      const fn2 = vi.fn(() => Promise.resolve('success2'))

      const options1 = {
        timeout: 1000,
        interval: 16,
        log: true,
        _runnableTimeout: 1000,
        _start: new Date(),
      }

      const options2 = {
        timeout: 1000,
        interval: 16,
        log: true,
        _runnableTimeout: 1000,
        _start: new Date(),
      }

      const promise1 = retries.retry(fn1, options1)
      const promise2 = retries.retry(fn2, options2)

      // Advance timers
      await vi.advanceTimersByTimeAsync(20)

      // Promise.map should reject when one promise rejects (due to ended())
      await expect(
        Promise.map([promise1, promise2], (p) => p),
      ).rejects.toThrow('Retry ended: promise was canceled or runnable changed')

      expect(fn1).not.toHaveBeenCalled()
      expect(fn2).not.toHaveBeenCalled()
    })

    it('checks ended() after command:retry event', async () => {
      // Test that ended() is checked both before and after the command:retry event
      const fn = vi.fn(() => Promise.resolve('success'))
      const options = {
        timeout: 1000,
        interval: 16,
        log: true,
        _runnableTimeout: 1000,
        _start: new Date(),
      }

      // Set up action handler to change state after first check
      let checkCount = 0

      mockCypress.action.mockImplementation((event, handler) => {
        if (event === 'cy:command:retry' && checkCount === 0) {
          checkCount++
          // Change runnable after first ended() check passes
          mockState('runnable', { id: 'test-2' })
          handler(options)
        }
      })

      const promise = retries.retry(fn, options)

      // Advance timers
      await vi.advanceTimersByTimeAsync(20)

      // Should reject on second ended() check
      await expect(promise).rejects.toThrow('Retry ended: promise was canceled or runnable changed')

      expect(fn).not.toHaveBeenCalled()
    })
  })

  describe('integration with Promise.map (original bug scenario)', () => {
    it('demonstrates the original bug: Promise.map would succeed with undefined values', async () => {
      // This test shows what would happen WITHOUT the fix:
      // - One promise ends (canceled/runnable changed) -> returns undefined (old behavior)
      // - Promise.map receives [undefined, 'success'] -> treats as success
      // - .then() handler is called with undefined values -> crashes on routeId access

      // Simulate the old behavior by creating a promise that resolves with undefined
      // (This is what would happen without our fix)
      const oldBehaviorPromise = Promise.resolve(undefined)
      const successPromise = Promise.resolve({ routeId: 'route-1', data: 'success' })

      // Without the fix, Promise.map would succeed with [undefined, {...}]
      const results = await Promise.map([oldBehaviorPromise, successPromise], (p) => p)

      // This demonstrates the bug: results[0] is undefined
      expect(results[0]).toBeUndefined()
      expect(results[1]).toEqual({ routeId: 'route-1', data: 'success' })

      // This would cause the crash: results[0].routeId
      expect(() => {
        results[0].routeId
      }).toThrow('Cannot read properties of undefined (reading \'routeId\')')
    })

    it('demonstrates the fix: Promise.map rejects when timeout exceeded without error set', async () => {
      // With the fix, cy.retry rejects instead of returning undefined when timeout is exceeded
      // even if error is not set (handles test scenarios where _runnableTimeout is manipulated)
      const fn1 = vi.fn(() => Promise.resolve('success1'))
      const fn2 = vi.fn(() => Promise.resolve('success2'))

      const options1 = {
        timeout: 1000,
        interval: 16,
        log: true,
        // No error set, but should still throw on timeout
        _runnableTimeout: 0,
        _start: new Date(Date.now() - 100),
      }

      const options2 = {
        timeout: 1000,
        interval: 16,
        log: true,
        _runnableTimeout: 1000,
        _start: new Date(),
      }

      const promise1 = retries.retry(fn1, options1)
      const promise2 = retries.retry(fn2, options2)

      // With the fix, Promise.map should reject when one promise rejects
      await expect(
        Promise.map([promise1, promise2], (p) => p),
      ).rejects.toThrow()

      // The .then() handler should never be called
      expect(fn1).not.toHaveBeenCalled()
      expect(fn2).not.toHaveBeenCalled()
    })

    it('demonstrates the fix: Promise.map rejects when ended() returns true', async () => {
      // With the fix, cy.retry rejects instead of returning undefined when ended() is true
      mockState('canceled', true)

      const fn1 = vi.fn(() => Promise.resolve('success1'))
      const fn2 = vi.fn(() => Promise.resolve('success2'))

      const options1 = {
        timeout: 1000,
        interval: 16,
        log: true,
        _runnableTimeout: 1000,
        _start: new Date(),
      }

      const options2 = {
        timeout: 1000,
        interval: 16,
        log: true,
        _runnableTimeout: 1000,
        _start: new Date(),
      }

      const promise1 = retries.retry(fn1, options1)
      const promise2 = retries.retry(fn2, options2)

      // Advance timers to trigger the delay and ended() check
      await vi.advanceTimersByTimeAsync(20)

      // With the fix, Promise.map should reject when one promise rejects (due to ended())
      await expect(
        Promise.map([promise1, promise2], (p) => p),
      ).rejects.toThrow('Retry ended: promise was canceled or runnable changed')

      // The .then() handler should never be called
      expect(fn1).not.toHaveBeenCalled()
      expect(fn2).not.toHaveBeenCalled()
    })
  })
})
