import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTimers } from '../../../injection/timers'

type Timers = ReturnType<typeof createTimers>

const WRAPPED = ['setTimeout', 'setInterval', 'requestAnimationFrame', 'cancelAnimationFrame', 'clearTimeout', 'clearInterval'] as const

// Browsers number animation frames separately from timeouts and intervals, so
// this stands in for the native requestAnimationFrame with its own counter.
// `nextId` can be set to make a frame's id collide with a timer's.
const createFrames = () => {
  const callbacks = new Map<number, FrameRequestCallback>()
  const frames = {
    nextId: 1,
    request: vi.fn((callback: FrameRequestCallback) => {
      const id = frames.nextId++

      callbacks.set(id, callback)

      return id
    }),
    cancel: vi.fn((id: number) => {
      callbacks.delete(id)
    }),
    run: () => {
      const due = [...callbacks.entries()]

      callbacks.clear()
      due.forEach(([, callback]) => callback(performance.now()))
    },
  }

  return frames
}

describe('injection/timers', () => {
  let timers: Timers
  let frames: ReturnType<typeof createFrames>
  let originals: Partial<Record<typeof WRAPPED[number], unknown>>
  let nativeClearTimeout: ReturnType<typeof vi.fn>
  let calls: string[]

  beforeEach(() => {
    originals = {}
    WRAPPED.forEach((name) => {
      originals[name] = window[name]
    })

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })

    // Fake timers hand back Node-style Timeout objects. Browsers return
    // numbers, which is what lets a frame id collide with a timeout id.
    const fakeSetTimeout = window.setTimeout
    const fakeSetInterval = window.setInterval
    const fakeClearTimeout = window.clearTimeout

    nativeClearTimeout = vi.fn((id?: number) => fakeClearTimeout(id))

    frames = createFrames()
    Object.assign(window, {
      setTimeout: (...args: Parameters<typeof setTimeout>) => Number(fakeSetTimeout(...args)),
      setInterval: (...args: Parameters<typeof setInterval>) => Number(fakeSetInterval(...args)),
      clearTimeout: nativeClearTimeout,
      requestAnimationFrame: frames.request,
      cancelAnimationFrame: frames.cancel,
    })

    calls = []
    timers = createTimers()
    timers.wrap()
  })

  afterEach(() => {
    vi.useRealTimers()

    WRAPPED.forEach((name) => {
      Object.assign(window, { [name]: originals[name] })
    })
  })

  const record = (name: string) => {
    return () => {
      calls.push(name)
    }
  }

  describe('while not paused', () => {
    it('runs setTimeout callbacks with their params when they come due', () => {
      window.setTimeout((first: string, last: string) => calls.push(`${first} ${last}`), 10, 'Ada', 'Lovelace')

      vi.advanceTimersByTime(9)
      expect(calls).toEqual([])

      vi.advanceTimersByTime(1)
      expect(calls).toEqual(['Ada Lovelace'])
    })

    it('runs every setInterval tick until the interval is cleared', () => {
      const id = window.setInterval(record('tick'), 10)

      vi.advanceTimersByTime(30)
      window.clearInterval(id)
      vi.advanceTimersByTime(30)

      expect(calls).toEqual(['tick', 'tick', 'tick'])
    })

    it('runs requestAnimationFrame callbacks', () => {
      window.requestAnimationFrame(record('frame'))
      frames.run()

      expect(calls).toEqual(['frame'])
    })

    it('evaluates a string handler on the window', () => {
      window.setTimeout('window.__timersSpecResult = "Grace Hopper"', 0)
      vi.advanceTimersByTime(0)

      expect(window).toHaveProperty('__timersSpecResult', 'Grace Hopper')
      delete (window as { __timersSpecResult?: string }).__timersSpecResult
    })

    it('passes cancels through to the native function', () => {
      const id = window.setTimeout(record('timeout'), 10)

      window.clearTimeout(id)
      vi.advanceTimersByTime(10)

      expect(calls).toEqual([])
    })
  })

  describe('while paused', () => {
    it('queues callbacks that come due and replays them in order on unpause', () => {
      timers.pause(true)

      window.setTimeout(record('first timeout'), 10)
      window.requestAnimationFrame(record('frame'))
      window.setTimeout(record('second timeout'), 20)

      vi.advanceTimersByTime(10)
      frames.run()
      vi.advanceTimersByTime(10)

      expect(calls).toEqual([])

      timers.pause(false)

      expect(calls).toEqual(['first timeout', 'frame', 'second timeout'])
    })

    it('queues every interval tick that comes due', () => {
      timers.pause(true)

      window.setInterval(record('tick'), 10)
      vi.advanceTimersByTime(30)

      timers.pause(false)

      expect(calls).toEqual(['tick', 'tick', 'tick'])
    })

    it('skips queued ticks of an interval that an earlier flushed callback clears', () => {
      timers.pause(true)

      const id = window.setInterval(() => {
        calls.push('tick')
        window.clearInterval(id)
      }, 10)

      vi.advanceTimersByTime(30)
      timers.pause(false)

      expect(calls).toEqual(['tick'])
    })

    it('drops ticks that came due before an interval was cleared while paused', () => {
      timers.pause(true)

      const id = window.setInterval(record('tick'), 10)

      vi.advanceTimersByTime(20)
      window.clearInterval(id)
      timers.pause(false)

      expect(calls).toEqual([])
    })

    it('drops a queued setTimeout that is cleared while paused', () => {
      timers.pause(true)

      const id = window.setTimeout(record('cleared'), 10)

      window.setTimeout(record('kept'), 10)
      vi.advanceTimersByTime(10)
      window.clearTimeout(id)
      timers.pause(false)

      expect(calls).toEqual(['kept'])
    })

    it('does not run a queued setTimeout that an earlier flushed callback clears', () => {
      timers.pause(true)

      let laterId: number

      window.setTimeout(() => {
        calls.push('first')
        window.clearTimeout(laterId)
      }, 10)

      laterId = window.setTimeout(record('later'), 20)

      vi.advanceTimersByTime(20)
      timers.pause(false)

      expect(calls).toEqual(['first'])
    })

    it('lets clearInterval cancel a queued setTimeout, and clearTimeout a queued interval, as browsers do', () => {
      timers.pause(true)

      const timeoutId = window.setTimeout(record('timeout'), 10)
      const intervalId = window.setInterval(record('tick'), 10)

      vi.advanceTimersByTime(10)
      window.clearInterval(timeoutId)
      window.clearTimeout(intervalId)
      timers.pause(false)

      expect(calls).toEqual([])
    })

    it('does not run a queued requestAnimationFrame callback that an earlier flushed callback cancels', () => {
      timers.pause(true)

      let frameId: number

      window.setTimeout(() => {
        calls.push('timeout')
        window.cancelAnimationFrame(frameId)
      }, 10)

      vi.advanceTimersByTime(10)
      frameId = window.requestAnimationFrame(record('frame'))
      frames.run()
      timers.pause(false)

      expect(calls).toEqual(['timeout'])
      expect(frames.cancel).toHaveBeenCalledWith(frameId)
    })

    it('keeps requestAnimationFrame ids apart from setTimeout ids when they collide', () => {
      timers.pause(true)

      const timeoutId = window.setTimeout(record('timeout'), 10)

      frames.nextId = timeoutId

      const frameId = window.requestAnimationFrame(record('frame'))

      expect(frameId).toBe(timeoutId)

      const otherTimeoutId = window.setTimeout(record('other timeout'), 10)
      const otherFrameId = window.requestAnimationFrame(record('other frame'))

      vi.advanceTimersByTime(10)
      frames.run()

      window.clearTimeout(timeoutId)
      window.cancelAnimationFrame(otherFrameId)
      timers.pause(false)

      expect(otherFrameId).toBe(otherTimeoutId)
      expect(calls).toEqual(['other timeout', 'frame'])
    })

    it('ignores a cancel for an id with nothing queued, and still calls the native cancel', () => {
      timers.pause(true)
      window.setTimeout(record('timeout'), 10)
      window.requestAnimationFrame(record('frame'))
      vi.advanceTimersByTime(10)
      frames.run()

      window.clearTimeout(987654321)
      window.clearInterval(undefined)
      window.cancelAnimationFrame(987654321)
      timers.pause(false)

      expect(calls).toEqual(['timeout', 'frame'])
      expect(nativeClearTimeout).toHaveBeenCalledWith(987654321)
      expect(frames.cancel).toHaveBeenCalledWith(987654321)
    })

    it('neither replays earlier entries again nor nests the next one when a replayed callback unpauses', () => {
      timers.pause(true)

      window.setTimeout(() => {
        calls.push('first start')
        timers.pause(false)
        calls.push('first end')
      }, 10)

      window.setTimeout(record('second'), 20)
      vi.advanceTimersByTime(20)
      timers.pause(false)

      expect(calls).toEqual(['first start', 'first end', 'second'])
    })

    it('keeps the remaining entries queued until the next unpause when a replayed callback pauses', () => {
      timers.pause(true)

      window.setTimeout(() => {
        calls.push('first')
        timers.pause(true)
      }, 10)

      window.setTimeout(record('second'), 20)
      vi.advanceTimersByTime(20)
      timers.pause(false)

      expect(calls).toEqual(['first'])

      window.setTimeout(record('third'), 10)
      vi.advanceTimersByTime(10)

      expect(calls).toEqual(['first'])

      timers.pause(false)

      expect(calls).toEqual(['first', 'second', 'third'])
    })

    it('runs new callbacks directly once unpaused', () => {
      timers.pause(true)
      timers.pause(false)

      window.setTimeout(record('timeout'), 10)
      vi.advanceTimersByTime(10)

      expect(calls).toEqual(['timeout'])
    })
  })

  describe('reset', () => {
    it('discards the queue and unpauses', () => {
      timers.pause(true)

      window.setTimeout(record('discarded'), 10)
      vi.advanceTimersByTime(10)

      timers.reset()
      timers.pause(false)

      window.setTimeout(record('after reset'), 10)
      vi.advanceTimersByTime(10)

      expect(calls).toEqual(['after reset'])
    })
  })
})
