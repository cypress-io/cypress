type TimerFnName = 'setTimeout' | 'setInterval' | 'requestAnimationFrame'
type CancelFnName = 'clearTimeout' | 'clearInterval'

interface QueuedTimer {
  timerId: number
  type: TimerFnName
  fnOrCode: TimerHandler
  params: unknown[]
}

// The runner compiles with Node's types, which merge Node's timer overloads
// into `window`. The AUT only ever has the DOM ones, so wrap against those.
type TimerWindow = Pick<WindowOrWorkerGlobalScope, 'setTimeout' | 'setInterval' | 'clearTimeout' | 'clearInterval'>
  & Pick<AnimationFrameProvider, 'requestAnimationFrame'>

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

      // a setInterval can queue many callbacks while paused, and one of
      // them may cancel the interval, so skip the rest once that happens
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
    const timerWindow: TimerWindow = window

    const timerOriginals = {
      setTimeout: timerWindow.setTimeout,
      setInterval: timerWindow.setInterval,
      requestAnimationFrame: timerWindow.requestAnimationFrame,
    }

    const cancelOriginals = {
      clearTimeout: timerWindow.clearTimeout,
      clearInterval: timerWindow.clearInterval,
    }

    const wrapCancel = (fnName: CancelFnName) => {
      return (timerId: number) => {
        if (flushing) {
          canceledTimerIds[timerId] = true
        }

        return cancelOriginals[fnName].apply(window, [timerId])
      }
    }

    const wrapTimer = (fnName: TimerFnName) => {
      return (fnOrCode: TimerHandler, delay?: number, ...params: unknown[]): number => {
        const timerOverride = (...params: unknown[]) => {
          // while paused, hold the callback so it runs as soon as we unpause
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

        const timerId: number = timerOriginals[fnName].apply(window, [timerOverride, delay, ...params])

        return timerId
      }
    }

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
