export const createTimers = () => {
  let paused
  let flushing
  let timerQueue
  let canceledTimerIds

  const reset = () => {
    paused = false
    flushing = false
    timerQueue = []
    canceledTimerIds = {}
  }

  const invoke = (fnOrCode, params = []) => {
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

  const pause = (shouldPause) => {
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

    const callThrough = (fnName, args) => {
      return originals[fnName].apply(window, args)
    }

    const wrapCancel = (fnName) => {
      return (timerId) => {
        if (flushing) {
          canceledTimerIds[timerId] = true
        }

        return callThrough(fnName, [timerId])
      }
    }

    const wrapTimer = (fnName) => {
      return (...args) => {
        let timerId
        let [fnOrCode, delay, ...params] = args

        const timerOverride = (...params) => {
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

        timerId = callThrough(fnName, [timerOverride, delay, ...params])

        return timerId
      }
    }

    window.setTimeout = wrapTimer('setTimeout')
    window.setInterval = wrapTimer('setInterval')
    window.requestAnimationFrame = wrapTimer('requestAnimationFrame')
    window.clearTimeout = wrapCancel('clearTimeout')
    window.clearInterval = wrapCancel('clearInterval')
  }

  // start with initial values
  reset()

  return {
    wrap,

    reset,

    pause,
  }
}
