import type { EventEmitter } from 'events'
import * as humanTime from './human_time'

const MIN_TIMEOUT_MS = 10 * 60 * 1000
// setTimeout fires immediately for delays above this
const MAX_TIMER_MS = 2 ** 31 - 1

const CONFIGURED_TIMEOUTS = [
  'defaultCommandTimeout',
  'requestTimeout',
  'responseTimeout',
  'pageLoadTimeout',
  'execTimeout',
  'taskTimeout',
] as const

type TimeoutConfig = Partial<Record<typeof CONFIGURED_TIMEOUTS[number], number>>

/**
 * How long run mode waits without any activity from the browser before failing the spec.
 * A healthy run is silent for at most one command, which its own configured timeout
 * bounds, so the window is twice the longest of those (at least 10 minutes).
 * CYPRESS_INTERNAL_RUN_INACTIVITY_TIMEOUT overrides it in ms; 0 turns the watchdog off.
 */
export const getRunInactivityTimeout = (config: object, env: NodeJS.ProcessEnv = process.env): number => {
  const override = env.CYPRESS_INTERNAL_RUN_INACTIVITY_TIMEOUT

  if (override !== undefined && override !== '') {
    const ms = Number(override)

    if (Number.isFinite(ms) && ms >= 0) {
      return Math.min(ms, MAX_TIMER_MS)
    }
  }

  const timeouts = config as TimeoutConfig
  const longest = Math.max(0, ...CONFIGURED_TIMEOUTS.map((key) => Number(timeouts[key]) || 0))

  return Math.min(Math.max(MIN_TIMEOUT_MS, longest * 2), MAX_TIMER_MS)
}

/**
 * Calls onInactive once if `timeoutMs` passes without a 'driver:activity' event. Timing
 * starts at the first activity, since connecting to the browser has its own timeout.
 * Returns a function that stops watching.
 */
export const watchForInactivity = ({ emitter, timeoutMs, onInactive }: {
  emitter: EventEmitter
  timeoutMs: number
  onInactive: (duration: string) => void
}): () => void => {
  if (!timeoutMs) {
    return () => {}
  }

  let timer: NodeJS.Timeout | undefined

  const stop = () => {
    clearTimeout(timer)
    emitter.removeListener('driver:activity', onActivity)
  }

  const onActivity = () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      stop()
      onInactive(humanTime.long(timeoutMs, false))
    }, timeoutMs)
  }

  emitter.on('driver:activity', onActivity)

  return stop
}
