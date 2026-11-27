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

    it('drops ticks that came due before an interval was cleared while paused', () => {
      const callback = vi.fn()

      timers.pause(true)

      const timerId = window.setInterval(callback, 10)

      vi.advanceTimersByTime(20)
      window.clearInterval(timerId)
      timers.pause(false)

      expect(callback).not.toHaveBeenCalled()
    })

    it('drops a setTimeout cleared after it came due while paused', () => {
      const cleared = vi.fn()
      const kept = vi.fn()

      timers.pause(true)

      const timerId = window.setTimeout(cleared, 10)

      window.setTimeout(kept, 10)
      vi.advanceTimersByTime(10)
      window.clearTimeout(timerId)
      timers.pause(false)

      expect(cleared).not.toHaveBeenCalled()
      expect(kept).toHaveBeenCalledOnce()
    })

    it('does not run a queued setTimeout that an earlier flushed callback clears', () => {
      const later = vi.fn()

      timers.pause(true)

      window.setTimeout(() => window.clearTimeout(laterId), 10)

      const laterId = window.setTimeout(later, 20)

      vi.advanceTimersByTime(20)
      timers.pause(false)

      expect(later).not.toHaveBeenCalled()
    })

    it('lets clearInterval drop a queued setTimeout, and clearTimeout a queued interval, while paused', () => {
      const timeout = vi.fn()
      const interval = vi.fn()

      timers.pause(true)

      const timeoutId = window.setTimeout(timeout, 10)
      const intervalId = window.setInterval(interval, 10)

      vi.advanceTimersByTime(10)
      window.clearInterval(timeoutId)
      window.clearTimeout(intervalId)
      timers.pause(false)

      expect(timeout).not.toHaveBeenCalled()
      expect(interval).not.toHaveBeenCalled()
    })

    it('does not run a queued requestAnimationFrame callback that an earlier flushed callback cancels', () => {
      const frame = vi.fn()

      timers.pause(true)

      window.setTimeout(() => window.cancelAnimationFrame(frameId), 10)
      vi.advanceTimersByTime(10)

      const frameId = window.requestAnimationFrame(frame)

      vi.advanceTimersToNextFrame()
      timers.pause(false)

      expect(frame).not.toHaveBeenCalled()
    })

    it('neither replays earlier entries again nor nests the next one when a flushed callback unpauses', () => {
      const calls: string[] = []

      timers.pause(true)

      window.setTimeout(() => {
        calls.push('first start')
        timers.pause(false)
        calls.push('first end')
      }, 10)

      window.setTimeout(() => calls.push('second'), 20)
      vi.advanceTimersByTime(20)
      timers.pause(false)

      expect(calls).toEqual(['first start', 'first end', 'second'])
    })

    it('keeps the remaining entries queued until the next unpause when a flushed callback pauses', () => {
      const calls: string[] = []

      timers.pause(true)

      window.setTimeout(() => {
        calls.push('first')
        timers.pause(true)
      }, 10)

      window.setTimeout(() => calls.push('second'), 20)
      vi.advanceTimersByTime(20)
      timers.pause(false)
      expect(calls).toEqual(['first'])

      window.setTimeout(() => calls.push('third'), 10)
      vi.advanceTimersByTime(10)
      expect(calls).toEqual(['first'])

      timers.pause(false)
      expect(calls).toEqual(['first', 'second', 'third'])
    })
  })

  // Browsers number animation frames separately from timeouts, so their ids
  // can collide. Fake timers draw both from one counter, so these specs
  // re-wrap natives that number frames on their own, and return numbers from
  // setTimeout the way browsers do.
  describe('with browser-style timer ids', () => {
    let frameCallbacks: Map<number, FrameRequestCallback>
    let nextFrameId: number
    let nativeClearTimeout: MockInstance<(timerId?: number) => void>
    let nativeCancelAnimationFrame: MockInstance<(frameId: number) => void>

    const runFrames = () => {
      const due = [...frameCallbacks.values()]

      frameCallbacks.clear()
      due.forEach((callback) => callback(performance.now()))
    }

    beforeEach(() => {
      Object.assign(window, unwrapped)

      frameCallbacks = new Map()
      nextFrameId = 1

      const nativeTimers = {
        setTimeout: (...args: Parameters<typeof window.setTimeout>) => Number(unwrapped.setTimeout(...args)),
        clearTimeout: (timerId?: number) => unwrapped.clearTimeout(timerId),
        requestAnimationFrame: (callback: FrameRequestCallback) => {
          const frameId = nextFrameId++

          frameCallbacks.set(frameId, callback)

          return frameId
        },
        cancelAnimationFrame: (frameId: number) => {
          frameCallbacks.delete(frameId)
        },
      }

      nativeClearTimeout = vi.spyOn(nativeTimers, 'clearTimeout')
      nativeCancelAnimationFrame = vi.spyOn(nativeTimers, 'cancelAnimationFrame')
      Object.assign(window, nativeTimers)

      timers = createTimers()
      timers.wrap()
    })

    it('keeps a requestAnimationFrame id apart from a setTimeout id it collides with', () => {
      const calls: string[] = []

      timers.pause(true)

      const timeoutId = window.setTimeout(() => calls.push('timeout'), 10)

      nextFrameId = timeoutId

      const frameId = window.requestAnimationFrame(() => calls.push('frame'))
      const otherTimeoutId = window.setTimeout(() => calls.push('other timeout'), 10)
      const otherFrameId = window.requestAnimationFrame(() => calls.push('other frame'))

      expect(frameId).toBe(timeoutId)
      expect(otherFrameId).toBe(otherTimeoutId)

      vi.advanceTimersByTime(10)
      runFrames()

      window.clearTimeout(timeoutId)
      window.cancelAnimationFrame(otherFrameId)
      timers.pause(false)

      expect(calls).toEqual(['other timeout', 'frame'])
    })

    it('ignores a cancel for an id with nothing queued, and still calls the native cancel', () => {
      const timeout = vi.fn()
      const frame = vi.fn()

      timers.pause(true)
      window.setTimeout(timeout, 10)
      window.requestAnimationFrame(frame)
      vi.advanceTimersByTime(10)
      runFrames()

      window.clearTimeout(987654321)
      window.cancelAnimationFrame(987654321)
      timers.pause(false)

      expect(timeout).toHaveBeenCalledOnce()
      expect(frame).toHaveBeenCalledOnce()
      expect(nativeClearTimeout).toHaveBeenCalledWith(987654321)
      expect(nativeCancelAnimationFrame).toHaveBeenCalledWith(987654321)
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
