const _ = require('lodash')

const create = () => {
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

  const isPaused = () => {
    return paused
  }

  const invoke = (contentWindow, fnOrCode, params = []) => {
    if (_.isFunction(fnOrCode)) {
      return fnOrCode.apply(contentWindow, params)
    }

    return contentWindow.eval(fnOrCode)
  }

  const flushTimerQueue = () => {
    flushing = true

    _.each(timerQueue, (timer) => {
      const { timerId, type, fnOrCode, params, contentWindow } = timer

      // if we are a setInterval and we're been canceled
      // then just return. this can happen when a setInterval
      // queues many callbacks, and from within that callback
      // we would have canceled the original setInterval
      if (type === 'setInterval' && canceledTimerIds[timerId]) {
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
