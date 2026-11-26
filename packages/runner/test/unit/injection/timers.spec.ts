import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTimers } from '../../../injection/timers'

const WRAPPED = ['setTimeout', 'setInterval', 'requestAnimationFrame', 'clearTimeout', 'clearInterval'] as const

describe('injection/timers', () => {
  let originals: Record<typeof WRAPPED[number], unknown>
  let timers: ReturnType<typeof createTimers>

  beforeEach(() => {
    vi.useFakeTimers({
      toFake: [...WRAPPED, 'cancelAnimationFrame', 'performance'],
    })

    originals = Object.fromEntries(WRAPPED.map((name) => [name, window[name]])) as typeof originals

    timers = createTimers()
    timers.wrap()
  })

  afterEach(() => {
    Object.assign(window, originals)
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('passes the frame timestamp through when not paused', () => {
    const callback = vi.fn()

    window.requestAnimationFrame(callback)
    vi.advanceTimersToNextFrame()

    expect(callback).toHaveBeenCalledExactlyOnceWith(16)
  })

  it('replays a held requestAnimationFrame callback with the time it runs, not the time it came due', () => {
    const callback = vi.fn()

    timers.pause(true)
    window.requestAnimationFrame(callback)
    vi.advanceTimersToNextFrame()
    vi.advanceTimersByTime(5000)

    expect(callback).not.toHaveBeenCalled()

    timers.pause(false)

    expect(callback).toHaveBeenCalledExactlyOnceWith(5016)
  })

  it('gives every requestAnimationFrame callback held in one flush the same timestamp', () => {
    const first = vi.fn()
    const second = vi.fn()

    timers.pause(true)
    window.requestAnimationFrame(first)
    window.requestAnimationFrame(second)
    vi.advanceTimersToNextFrame()

    vi.spyOn(performance, 'now')
    .mockReturnValueOnce(5016)
    .mockReturnValueOnce(5020)

    timers.pause(false)

    expect(first).toHaveBeenCalledExactlyOnceWith(5016)
    expect(second).toHaveBeenCalledExactlyOnceWith(5016)
  })

  it('replays a held setTimeout callback with the arguments it was scheduled with', () => {
    const callback = vi.fn()

    timers.pause(true)
    window.setTimeout(callback, 100, 'Ada Lovelace', 'ada.lovelace@example.com')
    vi.advanceTimersByTime(100)

    expect(callback).not.toHaveBeenCalled()

    timers.pause(false)

    expect(callback).toHaveBeenCalledExactlyOnceWith('Ada Lovelace', 'ada.lovelace@example.com')
  })
})
