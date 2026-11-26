import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MockInstance } from 'vitest'
import { createTimers } from '../../../injection/timers'

// String handlers can only report back through a global
const timerWindow: Window & { codeRan?: boolean } = window

describe('injection/timers', () => {
  let timers: ReturnType<typeof createTimers>
  let unwrapped: Pick<Window, 'setTimeout' | 'setInterval' | 'requestAnimationFrame' | 'clearTimeout' | 'clearInterval'>
  let nativeSetTimeout: MockInstance<typeof window.setTimeout>

  beforeEach(() => {
    // Fake the browser timers before wrapping, so the wrapper calls through to
    // timers the spec can advance deterministically
    vi.useFakeTimers({
      toFake: ['setTimeout', 'setInterval', 'requestAnimationFrame', 'clearTimeout', 'clearInterval', 'cancelAnimationFrame', 'performance', 'Date'],
    })

    unwrapped = {
      setTimeout: window.setTimeout,
      setInterval: window.setInterval,
      requestAnimationFrame: window.requestAnimationFrame,
      clearTimeout: window.clearTimeout,
      clearInterval: window.clearInterval,
    }

    nativeSetTimeout = vi.spyOn(window, 'setTimeout')
    timers = createTimers()
    timers.wrap()
  })

  afterEach(() => {
    Object.assign(window, unwrapped)
    vi.useRealTimers()
    delete timerWindow.codeRan
  })

  describe('while not paused', () => {
    it('calls setTimeout through with its arguments, bound to window', () => {
      const callback = vi.fn(function (this: unknown) {
        return this
      })

      window.setTimeout(callback, 10, 'Ada', 'Lovelace')

      vi.advanceTimersByTime(9)
      expect(callback).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1)
      expect(callback).toHaveBeenCalledExactlyOnceWith('Ada', 'Lovelace')
      expect(callback.mock.results[0].value).toBe(window)
    })

    it('returns the native timer id, so clearTimeout cancels it', () => {
      const callback = vi.fn()
      const timerId = window.setTimeout(callback, 10)

      expect(timerId).toBe(nativeSetTimeout.mock.results[0].value)
      expect(window.clearTimeout(timerId)).toBeUndefined()

      vi.advanceTimersByTime(20)
      expect(callback).not.toHaveBeenCalled()
    })

    it('repeats setInterval until clearInterval', () => {
      const callback = vi.fn()
      const timerId = window.setInterval(callback, 10, 'tick')

      vi.advanceTimersByTime(30)
      expect(callback).toHaveBeenCalledTimes(3)
      expect(callback).toHaveBeenLastCalledWith('tick')

      window.clearInterval(timerId)
      vi.advanceTimersByTime(30)
      expect(callback).toHaveBeenCalledTimes(3)
    })

    it('passes requestAnimationFrame its timestamp', () => {
      const callback = vi.fn()

      window.requestAnimationFrame(callback)
      vi.advanceTimersToNextFrame()

      expect(callback).toHaveBeenCalledExactlyOnceWith(expect.any(Number))
    })

    it('evaluates a string handler on window', () => {
      window.setTimeout('window.codeRan = true', 10)
      vi.advanceTimersByTime(10)

      expect(timerWindow.codeRan).toBe(true)
    })
  })

  describe('while paused', () => {
    it('holds due callbacks and runs them in order with their arguments on unpause', () => {
      const calls: string[] = []

      timers.pause(true)

      window.setTimeout((name: string) => calls.push(`timeout:${name}`), 10, 'Grace')
      window.requestAnimationFrame((timestamp) => calls.push(`frame:${typeof timestamp}`))
      window.setTimeout('window.codeRan = true', 30)

      vi.advanceTimersByTime(100)
      expect(calls).toEqual([])
      expect(timerWindow.codeRan).toBeUndefined()

      timers.pause(false)

      expect(calls).toEqual(['timeout:Grace', 'frame:number'])
      expect(timerWindow.codeRan).toBe(true)
    })

    it('holds a timer scheduled before pausing that comes due while paused', () => {
      const callback = vi.fn()

      window.setTimeout(callback, 10)
      timers.pause(true)

      vi.advanceTimersByTime(20)
      expect(callback).not.toHaveBeenCalled()

      timers.pause(false)
      expect(callback).toHaveBeenCalledOnce()
    })

    it('does not run a timer cleared before it came due', () => {
      const callback = vi.fn()

      timers.pause(true)

      const timerId = window.setTimeout(callback, 10)

      window.clearTimeout(timerId)
      vi.advanceTimersByTime(20)
      timers.pause(false)

      expect(callback).not.toHaveBeenCalled()
    })

    it('queues every setInterval tick and replays them all on unpause', () => {
      const callback = vi.fn()

      timers.pause(true)
      window.setInterval(callback, 10)

      vi.advanceTimersByTime(30)
      expect(callback).not.toHaveBeenCalled()

      timers.pause(false)
      expect(callback).toHaveBeenCalledTimes(3)
    })

    it.each(['clearInterval', 'clearTimeout'] as const)('skips the remaining queued ticks of an interval canceled by %s during the flush', (cancelFnName) => {
      const callback = vi.fn(() => {
        if (callback.mock.calls.length === 2) {
          window[cancelFnName](timerId)
        }
      })

      timers.pause(true)

      const timerId = window.setInterval(callback, 10)

      vi.advanceTimersByTime(50)
      timers.pause(false)

      expect(callback).toHaveBeenCalledTimes(2)

      vi.advanceTimersByTime(50)
      expect(callback).toHaveBeenCalledTimes(2)
    })

    it('runs timers scheduled from a flushed callback normally', () => {
      const later = vi.fn()

      timers.pause(true)
      window.setTimeout(() => window.setTimeout(later, 10), 10)

      vi.advanceTimersByTime(10)
      timers.pause(false)
      expect(later).not.toHaveBeenCalled()

      vi.advanceTimersByTime(10)
      expect(later).toHaveBeenCalledOnce()
    })

    it('treats a falsy argument as unpause', () => {
      const callback = vi.fn()

      timers.pause(true)
      window.setTimeout(callback, 10)
      vi.advanceTimersByTime(10)

      timers.pause(undefined)
      expect(callback).toHaveBeenCalledOnce()
    })
  })

  describe('reset', () => {
    it('discards queued callbacks and unpauses', () => {
      const queued = vi.fn()
      const afterReset = vi.fn()

      timers.pause(true)
      window.setTimeout(queued, 10)
      vi.advanceTimersByTime(10)

      timers.reset()
      timers.pause(false)
      expect(queued).not.toHaveBeenCalled()

      window.setTimeout(afterReset, 10)
      vi.advanceTimersByTime(10)
      expect(afterReset).toHaveBeenCalledOnce()
    })
  })
})
