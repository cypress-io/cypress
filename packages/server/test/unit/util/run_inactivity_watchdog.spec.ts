import { EventEmitter } from 'events'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getRunInactivityTimeout, watchForInactivity } from '../../../lib/util/run_inactivity_watchdog'

const TEN_MINUTES = 10 * 60 * 1000

describe('lib/util/run_inactivity_watchdog', () => {
  describe('.getRunInactivityTimeout', () => {
    const config = {
      defaultCommandTimeout: 4000,
      requestTimeout: 5000,
      responseTimeout: 30000,
      pageLoadTimeout: 60000,
      execTimeout: 60000,
      taskTimeout: 60000,
    }

    it('waits at least 10 minutes', () => {
      expect(getRunInactivityTimeout(config, {})).toBe(TEN_MINUTES)
    })

    it('waits twice the longest configured timeout when that is longer', () => {
      expect(getRunInactivityTimeout({ ...config, taskTimeout: 15 * 60 * 1000 }, {})).toBe(30 * 60 * 1000)
    })

    it('never exceeds what setTimeout can wait for', () => {
      expect(getRunInactivityTimeout({ ...config, pageLoadTimeout: 2e9 }, {})).toBe(2 ** 31 - 1)
    })

    it('uses CYPRESS_INTERNAL_RUN_INACTIVITY_TIMEOUT when set', () => {
      expect(getRunInactivityTimeout(config, { CYPRESS_INTERNAL_RUN_INACTIVITY_TIMEOUT: '5000' })).toBe(5000)
    })

    it('turns off when CYPRESS_INTERNAL_RUN_INACTIVITY_TIMEOUT is 0', () => {
      expect(getRunInactivityTimeout(config, { CYPRESS_INTERNAL_RUN_INACTIVITY_TIMEOUT: '0' })).toBe(0)
    })

    it('ignores an invalid CYPRESS_INTERNAL_RUN_INACTIVITY_TIMEOUT', () => {
      expect(getRunInactivityTimeout(config, { CYPRESS_INTERNAL_RUN_INACTIVITY_TIMEOUT: 'soon' })).toBe(TEN_MINUTES)
    })
  })

  describe('.watchForInactivity', () => {
    let emitter: EventEmitter
    let onInactive: ReturnType<typeof vi.fn>

    beforeEach(() => {
      vi.useFakeTimers()
      emitter = new EventEmitter()
      onInactive = vi.fn()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('does not start timing before the first activity', () => {
      watchForInactivity({ emitter, timeoutMs: 1000, onInactive })

      vi.advanceTimersByTime(5000)

      expect(onInactive).not.toHaveBeenCalled()
    })

    it('reports inactivity once the window passes without activity', () => {
      watchForInactivity({ emitter, timeoutMs: 60_000, onInactive })

      emitter.emit('driver:activity')
      vi.advanceTimersByTime(60_000)

      expect(onInactive).toHaveBeenCalledOnce()
      expect(onInactive).toHaveBeenCalledWith('1 minute')
    })

    it('restarts the window on each activity', () => {
      watchForInactivity({ emitter, timeoutMs: 1000, onInactive })

      emitter.emit('driver:activity')
      vi.advanceTimersByTime(900)
      emitter.emit('driver:activity')
      vi.advanceTimersByTime(900)

      expect(onInactive).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)

      expect(onInactive).toHaveBeenCalledOnce()
    })

    it('stops watching when stopped', () => {
      const stop = watchForInactivity({ emitter, timeoutMs: 1000, onInactive })

      emitter.emit('driver:activity')
      stop()
      vi.advanceTimersByTime(5000)

      expect(onInactive).not.toHaveBeenCalled()
      expect(emitter.listenerCount('driver:activity')).toBe(0)
    })

    it('does nothing when turned off', () => {
      watchForInactivity({ emitter, timeoutMs: 0, onInactive })

      emitter.emit('driver:activity')
      vi.advanceTimersByTime(TEN_MINUTES)

      expect(onInactive).not.toHaveBeenCalled()
      expect(emitter.listenerCount('driver:activity')).toBe(0)
    })
  })
})
