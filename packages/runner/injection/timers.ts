type TimerType = 'setTimeout' | 'setInterval' | 'requestAnimationFrame'

type CancelType = 'clearTimeout' | 'clearInterval'

interface QueuedTimer {
  timerId: number
  type: TimerType
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
    }

    const callThrough = (fnName: TimerType | CancelType, args: unknown[]): number => {
      return (originals[fnName] as (...args: unknown[]) => number).apply(window, args)
    }

    const wrapCancel = (fnName: CancelType) => {
      return (timerId?: number) => {
        if (flushing) {
          canceledTimerIds[timerId] = true
        }

        callThrough(fnName, [timerId])
      }
    }

    const wrapTimer = (fnName: TimerType) => {
      return (fnOrCode: TimerHandler, delay?: number, ...params: unknown[]) => {
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

    // `Object.assign` because the project's Node typings merge
    // `setTimeout.__promisify__` into `window.setTimeout`, which the browser's
    // own setTimeout, and so this wrapper, does not have.
    Object.assign(window, {
      setTimeout: wrapTimer('setTimeout'),
      setInterval: wrapTimer('setInterval'),
      requestAnimationFrame: wrapTimer('requestAnimationFrame'),
      clearTimeout: wrapCancel('clearTimeout'),
      clearInterval: wrapCancel('clearInterval'),
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
