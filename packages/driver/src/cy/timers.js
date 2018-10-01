const _ = require('lodash')

const setTimerFns = {
  setTimeout: 'clearTimeout',
  setInterval: 'clearInterval',
  requestAnimationFrame: 'cancelAnimationFrame',
}

const cancelTimerFns = _.invert(setTimerFns)

const create = () => {
  let _isPaused = false

  const _queues = {}

  const reset = () => {
    _.extend(_queues, {
      setTimeout: [],
      setInterval: [],
      requestAnimationFrame: [],
    })
  }

  const isPaused = () => {
    return _isPaused
  }

  const runTimerQueue = (queueName) => {
    _.each(_queues[queueName], (obj) => {
      const { contentWindow, args } = obj

      // TODO:
      // hold the timerId for setIntervals in another queue
      // in case clearInterval() is called on this id
      contentWindow[queueName](...args)
    })

    // reset the queue back to empty array
    _queues[queueName] = []
  }

  const pauseTimers = (pause) => {
    _isPaused = Boolean(pause)

    if (!_isPaused) {
      runTimerQueue('setTimeout')
      runTimerQueue('setInterval')
      runTimerQueue('requestAnimationFrame')
    }
  }

  const wrap = (contentWindow) => {
    const originals = {
      setTimeout: contentWindow.setTimeout,
      setInterval: contentWindow.setInterval,
      requestAnimationFrame: contentWindow.requestAnimationFrame,
      clearTimeout: contentWindow.clearTimeout,
      clearInterval: contentWindow.clearInterval,
      cancelAnimationFrame: contentWindow.cancelAnimationFrame,
    }

    const callThrough = (fnName, args) => {
      return originals[fnName].apply(contentWindow, args)
    }

    const realTimerIdFromAut = (fnName, args, cancelFn) => {
      // get a real timerId from the AUT
      const timerId = callThrough(fnName, args)

      _queues[fnName].push({
        args,
        timerId,
        contentWindow,
      })

      // we've gotten our timerId but we still need
      // to cancel this timer so that it doesn't
      // actually fire
      callThrough(cancelFn, [timerId])

      return timerId
    }

    const removeTimerFromQueue = (fnName, timerId) => {
      const queueName = cancelTimerFns[fnName]
      _queues[queueName] = _.reject(_queues[queueName], { timerId })

      // cancelling timers always returns undefined
      return undefined
    }

    // calls tasks in the order in which they were enqueued
    // clearTimeout / clearInterval stays the same
    // const macrotasks = [
    //   { type: 'setTimeout', timerId: ?, args: [], contentWindow: {} }
    // ]

    const wrapFn = (fnName) => (...args) => {
      const [timerId] = args

      // if we're not in pause mode
      // then just call through, all good
      if (!_isPaused) {
        // if fnName is "clearInterval"
        // removeTimerFromIntervalQueueById(timerId)

        return callThrough(fnName, args)
      }

      // else our timers are paused then we want to enqueue
      // new timers into our own internal queue
      //#
      // BUT if we're canceling, we want to slice out queued
      // timers that match up to ther timerId saved to the queue

      // are we are a setter or canceller?
      const cancelFn = setTimerFns[fnName]

      if (cancelFn) {
        return realTimerIdFromAut(fnName, args, cancelFn)
      }

      // else we are a canceller function and we need
      // to go find the queued timer by timerId and
      // slice it out of the queue
      return removeTimerFromQueue(fnName, timerId)
    }

    contentWindow.setTimeout = wrapFn('setTimeout')
    contentWindow.setInterval = wrapFn('setInterval')
    contentWindow.requestAnimationFrame = wrapFn('requestAnimationFrame')
    contentWindow.clearTimeout = wrapFn('clearTimeout')
    contentWindow.clearInterval = wrapFn('clearInterval')
    contentWindow.cancelAnimationFrame = wrapFn('cancelAnimationFrame')
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
