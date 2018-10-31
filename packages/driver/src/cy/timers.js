const _ = require('lodash')

const create = () => {
  let paused
  let flushing
  let timerQueue
  let cancelledTimerIds

  const reset = () => {
    paused = false
    flushing = false
    timerQueue = []
    cancelledTimerIds = {}
  }

  const isPaused = () => {
    return paused
  }

  const invoke = (contentWindow, fnOrCode, params = []) => {
    if (_.isString(fnOrCode)) {
      return contentWindow.eval(fnOrCode)
    }

    return fnOrCode(...params)
  }

  const flushTimerQueue = () => {
    flushing = true

    _.each(timerQueue, (timer) => {
      const { timerId, type, fnOrCode, params, contentWindow } = timer

      // if we are a setInterval and we're been cancelled
      // then just return. this can happen when a setInterval
      // queues many callbacks, and from within that callback
      // we would have cancelled the original setInterval
      if (type === 'setInterval' && cancelledTimerIds[timerId]) {
        return
      }

      invoke(contentWindow, fnOrCode, params)
    })

    reset()
  }

  const pauseTimers = (pause) => {
    paused = Boolean(pause)

    if (!paused) {
      flushTimerQueue()
    }
  }

  const wrap = (contentWindow) => {
    const originals = {
      setTimeout: contentWindow.setTimeout,
      setInterval: contentWindow.setInterval,
      requestAnimationFrame: contentWindow.requestAnimationFrame,
      clearTimeout: contentWindow.clearTimeout,
      clearInterval: contentWindow.clearInterval,
      // cancelAnimationFrame: contentWindow.cancelAnimationFrame,
    }

    const callThrough = (fnName, args) => {
      return originals[fnName].apply(contentWindow, args)
    }

    const wrapCancel = (fnName) => (timerId) => {
      if (flushing) {
        cancelledTimerIds[timerId] = true
      }

      return callThrough(fnName, [timerId])
    }

    const wrapTimer = (fnName) => (...args) => {
      const [fnOrCode, delay, ...params] = args

      let timerId

      const timerOverride = () => {
        // if we're currently paused then we need
        // to enqueue this timer callback and invoke
        // it immediately once we're unpaused
        if (paused) {
          timerQueue.push({
            timerId,
            fnOrCode,
            params,
            contentWindow,
            type: fnName,
          })

          return
        }

        // else go ahead and invoke the real function
        // the same way the browser otherwise would
        return invoke(contentWindow, fnOrCode, params)
      }

      timerId = callThrough(fnName, [timerOverride, delay, ...params])

      return timerId
    }

    contentWindow.setTimeout = wrapTimer('setTimeout')
    contentWindow.setInterval = wrapTimer('setInterval')
    contentWindow.requestAnimationFrame = wrapTimer('requestAnimationFrame')
    contentWindow.clearTimeout = wrapCancel('clearTimeout')
    contentWindow.clearInterval = wrapCancel('clearInterval')
    // contentWindow.cancelAnimationFrame = wrapFn('cancelAnimationFrame')
  }

  // always initially reset to set the state
  reset()

  return {
    wrap,

    reset,

    isPaused,

    pauseTimers,
  }
}

module.exports = {
  create,
}
