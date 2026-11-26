// The runner compiles with Node's types, which merge Node's timer overloads
// into `window`. The AUT only ever has the DOM ones, so wrap against those.
type TimerWindow = Pick<WindowOrWorkerGlobalScope, 'setTimeout' | 'setInterval' | 'clearTimeout' | 'clearInterval'>
  & Pick<AnimationFrameProvider, 'requestAnimationFrame'>

interface QueuedTimer {
  timerId: number
  type: 'setTimeout' | 'setInterval' | 'requestAnimationFrame'
  fnOrCode: TimerHandler
  params: unknown[]
}

export const createTimers = () => {
  let paused: boolean
  let flushing: boolean
  let timerQueue: QueuedTimer[]
  let canceledTimerIds: Record<number, boolean>

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

    timerQueue.forEach((timer) => {
      const { timerId, type, fnOrCode, params } = timer

      // if we are a setInterval and we're been canceled
      // then just return. this can happen when a setInterval
      // queues many callbacks, and from within that callback
      // we would have canceled the original setInterval
      if (type === 'setInterval' && canceledTimerIds[timerId]) {
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

    const wrapCancel = (fnName: 'clearTimeout' | 'clearInterval') => {
      return (timerId: number) => {
        if (flushing) {
          canceledTimerIds[timerId] = true
        }

        return callThrough(fnName, [timerId])
      }
    }

    const wrapTimer = (fnName: 'setTimeout' | 'setInterval' | 'requestAnimationFrame') => {
      return (...args: [TimerHandler, number?, ...unknown[]]): number => {
        const [fnOrCode, delay, ...params] = args

        const timerOverride = (...params: unknown[]) => {
          // if we're currently paused then we need
          // to enqueue this timer callback and invoke
          // it immediately once we're unpaused
          if (paused) {
            timerQueue.push({
              timerId,
              fnOrCode,
              params,
              type: fnName,
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

    const timerWindow: TimerWindow = window

    timerWindow.setTimeout = wrapTimer('setTimeout')
    timerWindow.setInterval = wrapTimer('setInterval')
    timerWindow.requestAnimationFrame = wrapTimer('requestAnimationFrame')
    timerWindow.clearTimeout = wrapCancel('clearTimeout')
    timerWindow.clearInterval = wrapCancel('clearInterval')
  }

  // start with initial values
  reset()

  return {
    wrap,

    reset,

    pause,
  }
}
