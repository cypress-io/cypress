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
  let natives: Partial<Record<typeof WRAPPED[number], unknown>>
  let calls: string[]

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })

    frames = createFrames()
    window.requestAnimationFrame = frames.request
    window.cancelAnimationFrame = frames.cancel

    natives = {}
    WRAPPED.forEach((name) => {
      natives[name] = window[name]
    })

    calls = []
    timers = createTimers()
    timers.wrap()
  })

  afterEach(() => {
    WRAPPED.forEach((name) => {
      Object.assign(window, { [name]: natives[name] })
    })

    vi.useRealTimers()
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

    it('replays ticks that came due before an interval was cleared while paused', () => {
      timers.pause(true)

      const id = window.setInterval(record('tick'), 10)

      vi.advanceTimersByTime(20)
      window.clearInterval(id)
      timers.pause(false)

      expect(calls).toEqual(['tick', 'tick'])
    })

    it('still runs a queued setTimeout that an earlier flushed callback clears, since it already came due', () => {
      timers.pause(true)

      let laterId: number

      window.setTimeout(() => {
        calls.push('first')
        window.clearTimeout(laterId)
      }, 10)

      laterId = window.setTimeout(record('later'), 20)

      vi.advanceTimersByTime(20)
      timers.pause(false)

      expect(calls).toEqual(['first', 'later'])
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
