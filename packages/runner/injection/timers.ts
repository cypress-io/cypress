type TimerFn = 'setTimeout' | 'setInterval' | 'requestAnimationFrame'
type CancelFn = 'clearTimeout' | 'clearInterval'

// The runner compiles with Node's types, which merge Node's timer overloads
// into `window`. The AUT only ever has the DOM ones, so wrap against those.
type TimerWindow = Pick<WindowOrWorkerGlobalScope & AnimationFrameProvider, TimerFn | CancelFn>

interface QueuedTimer {
  timerId: number
  type: TimerFn
  fnOrCode: TimerHandler
  params: unknown[]
}

export const createTimers = () => {
  let paused: boolean
  let flushing: boolean
  let timerQueue: QueuedTimer[]
  let canceledTimerIds: Record<number, boolean>

  // Bound when the timers are created, before any app or test code runs, so
  // held rAF callbacks keep the clock real frames use even after
  // `performance.now` is replaced, as `cy.clock(now, ['performance'])` does
  const { performance } = window
  const frameClock = performance.now.bind(performance)

  const reset = () => {
    paused = false
    flushing = false
    timerQueue = []
    canceledTimerIds = {}
  }

  const invoke = (fnOrCode: TimerHandler, params: unknown[] = []) => {
    if (typeof fnOrCode === 'function') {
      return fnOrCode.apply(window, params)
    }

    return window.eval(fnOrCode)
  }

  const flushTimerQueue = () => {
    flushing = true

    // Held rAF callbacks receive the time the first of them runs: one that came
    // due at 16 and replays at 5016 is called with 5016, not 16. The replay
    // runs outside any rendering frame, so the timestamp the browser passed is
    // stale by the length of the pause. Like callbacks in one real frame, every
    // rAF callback in this flush shares that timestamp.
    let frameTimestamp: number | undefined

    timerQueue.forEach((timer) => {
      const { timerId, type, fnOrCode, params } = timer

      // skip a canceled setInterval. a paused setInterval
      // queues many callbacks, and from within that callback
      // we would have canceled the original setInterval
      if (type === 'setInterval' && canceledTimerIds[timerId]) {
        return
      }

      if (type === 'requestAnimationFrame') {
        if (frameTimestamp === undefined) {
          frameTimestamp = frameClock()
        }

        invoke(fnOrCode, [frameTimestamp])

        return
      }

      invoke(fnOrCode, params)
    })

    reset()
  }

  const pause = (shouldPause: unknown) => {
    paused = Boolean(shouldPause)

    if (!paused) {
      flushTimerQueue()
    }
  }

  const wrap = () => {
    const originals = {
      setTimeout: window.setTimeout,
      setInterval: window.setInterval,
      requestAnimationFrame: window.requestAnimationFrame,
      clearTimeout: window.clearTimeout,
      clearInterval: window.clearInterval,
    }

    const callThrough = (fnName: keyof typeof originals, args: unknown[]) => {
      return originals[fnName].apply(window, args)
    }

    const wrapCancel = (fnName: CancelFn) => {
      return (timerId: number) => {
        if (flushing) {
          canceledTimerIds[timerId] = true
        }

        return callThrough(fnName, [timerId])
      }
    }

    const wrapTimer = (fnName: TimerFn) => {
      return (...args: [TimerHandler, number?, ...unknown[]]): number => {
        const [fnOrCode, delay, ...params] = args

        const timerOverride = (...params: unknown[]) => {
          if (paused) {
            timerQueue.push({
              timerId,
              fnOrCode,
              params,
              type: fnName,
            })

            return
          }

          return invoke(fnOrCode, params)
        }

        const timerId = callThrough(fnName, [timerOverride, delay, ...params])

        return timerId
      }
    }

    const timerWindow: TimerWindow = window

    timerWindow.setTimeout = wrapTimer('setTimeout')
    timerWindow.setInterval = wrapTimer('setInterval')
    timerWindow.requestAnimationFrame = wrapTimer('requestAnimationFrame')
    timerWindow.clearTimeout = wrapCancel('clearTimeout')
    timerWindow.clearInterval = wrapCancel('clearInterval')
  }

  reset()

  return {
    wrap,

    reset,

    pause,
  }
}
