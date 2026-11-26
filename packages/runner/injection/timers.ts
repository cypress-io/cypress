type TimerType = 'setTimeout' | 'setInterval' | 'requestAnimationFrame'

type CancelType = 'clearTimeout' | 'clearInterval' | 'cancelAnimationFrame'

// Browsers number animation frames separately from timeouts and intervals, so
// a frame and a timeout can share an id. clearTimeout and clearInterval share
// a namespace and can each cancel the other's timers.
type IdNamespace = 'timer' | 'frame'

const NAMESPACES: Record<TimerType | CancelType, IdNamespace> = {
  setTimeout: 'timer',
  setInterval: 'timer',
  clearTimeout: 'timer',
  clearInterval: 'timer',
  requestAnimationFrame: 'frame',
  cancelAnimationFrame: 'frame',
}

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

  const pause = (shouldPause?: boolean) => {
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

    const callThrough = (fnName: TimerType | CancelType, args: unknown[]): number => {
      // Safe because each wrapper passes the arguments its own native expects,
      // and only the scheduling natives' return values are used.
      return (originals[fnName] as (...args: unknown[]) => number).apply(window, args)
    }

    const wrapCancel = (fnName: CancelType) => {
      const namespace = NAMESPACES[fnName]

      return (timerId?: number) => {
        // A browser never runs a callback that was canceled before it ran,
        // even one that already came due while timers were paused.
        timerQueue = timerQueue.filter((timer) => {
          return timer.namespace !== namespace || timer.timerId !== timerId
        })

        callThrough(fnName, [timerId])
      }
    }

    const wrapTimer = (fnName: TimerType) => {
      const namespace = NAMESPACES[fnName]

      return (fnOrCode: TimerHandler, delay?: number, ...params: unknown[]) => {
        const timerOverride = (...params: unknown[]) => {
          // if we're currently paused then we need
          // to enqueue this timer callback and invoke
          // it immediately once we're unpaused
          if (paused) {
            timerQueue.push({
              timerId,
              namespace,
              fnOrCode,
              params,
            })

            return
          }

          // else go ahead and invoke the real function
          // the same way the browser otherwise would
          return invoke(fnOrCode, params)
        }

        const timerId = callThrough(fnName, [timerOverride, delay, ...params])

        return timerId
      }
    }

    // `Object.assign` because the project's Node typings merge
    // `setTimeout.__promisify__` into `window.setTimeout`, which the browser's
    // own setTimeout, and so this wrapper, does not have.
    Object.assign(window, {
      setTimeout: wrapTimer('setTimeout'),
      setInterval: wrapTimer('setInterval'),
      requestAnimationFrame: wrapTimer('requestAnimationFrame'),
      clearTimeout: wrapCancel('clearTimeout'),
      clearInterval: wrapCancel('clearInterval'),
      cancelAnimationFrame: wrapCancel('cancelAnimationFrame'),
    })
  }

  // start with initial values
  reset()

  return {
    wrap,

    reset,

    pause,
  }
}
