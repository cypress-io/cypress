type TimerFn = 'setTimeout' | 'setInterval' | 'requestAnimationFrame'
type CancelFn = 'clearTimeout' | 'clearInterval' | 'cancelAnimationFrame'

// Browsers number animation frames separately from timeouts and intervals, so
// a frame and a timeout can share an id. clearTimeout and clearInterval share
// a namespace and can each cancel the other's timers.
type IdNamespace = 'timer' | 'frame'

const NAMESPACES: Record<TimerFn | CancelFn, IdNamespace> = {
  setTimeout: 'timer',
  setInterval: 'timer',
  clearTimeout: 'timer',
  clearInterval: 'timer',
  requestAnimationFrame: 'frame',
  cancelAnimationFrame: 'frame',
}

// The runner compiles with Node's types, which merge Node's timer overloads
// into `window`. The AUT only ever has the DOM ones, so wrap against those.
type TimerWindow = Pick<WindowOrWorkerGlobalScope & AnimationFrameProvider, TimerFn | CancelFn>

interface QueuedTimer {
  timerId: number
  namespace: IdNamespace
  fnOrCode: TimerHandler
  params: unknown[]
}

export const createTimers = () => {
  let paused: boolean
  let flushing: boolean
  let timerQueue: QueuedTimer[]

  const reset = () => {
    paused = false
    flushing = false
    timerQueue = []
  }

  const invoke = (fnOrCode: TimerHandler, params: unknown[] = []) => {
    if (typeof fnOrCode === 'function') {
      return fnOrCode.apply(window, params)
    }

    return window.eval(fnOrCode)
  }

  // Takes entries off the queue one at a time rather than iterating over it,
  // so a replayed callback that cancels a queued timer, pauses again, or
  // resets is reflected before the next entry runs.
  const flushTimerQueue = () => {
    // A replayed callback that unpauses lets this loop carry on instead of
    // starting a second one over the same queue.
    if (flushing) {
      return
    }

    flushing = true

    try {
      while (!paused && timerQueue.length) {
        const { fnOrCode, params } = timerQueue.shift()

        invoke(fnOrCode, params)
      }
    } finally {
      flushing = false
    }
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
      cancelAnimationFrame: window.cancelAnimationFrame,
    }

    const callThrough = (fnName: keyof typeof originals, args: unknown[]) => {
      return originals[fnName].apply(window, args)
    }

    const wrapCancel = (fnName: CancelFn) => {
      const namespace = NAMESPACES[fnName]

      return (timerId: number) => {
        // A browser never runs a callback that was canceled before it ran,
        // even one that already came due while timers were paused.
        timerQueue = timerQueue.filter((timer) => {
          return timer.namespace !== namespace || timer.timerId !== timerId
        })

        return callThrough(fnName, [timerId])
      }
    }

    const wrapTimer = (fnName: TimerFn) => {
      const namespace = NAMESPACES[fnName]

      return (...args: [TimerHandler, number?, ...unknown[]]): number => {
        const [fnOrCode, delay, ...params] = args

        const timerOverride = (...params: unknown[]) => {
          if (paused) {
            timerQueue.push({
              timerId,
              namespace,
              fnOrCode,
              params,
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
    timerWindow.cancelAnimationFrame = wrapCancel('cancelAnimationFrame')
  }

  reset()

  return {
    wrap,

    reset,

    pause,
  }
}
