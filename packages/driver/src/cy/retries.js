const _ = require('lodash')
const Promise = require('bluebird')

const $errUtils = require('../cypress/error_utils')

const create = (Cypress, state, timeout, clearTimeout, whenStable, finishAssertions) => {
  return {
    retry (fn, options, log) {
      // remove the runnables timeout because we are now in retry
      // mode and should be handling timing out ourselves and dont
      // want to accidentally time out via mocha
      let runnableTimeout

      if (!options._runnableTimeout) {
        runnableTimeout = options.timeout ?? timeout()
        clearTimeout()
      }

      const current = state('current')

      // use the log if passed in, else fallback to options._log
      // else fall back to just grabbing the last log per our current command
      if (!log) {
        log = options._log ?? current?.getLastLog()
      }

      _.defaults(options, {
        _runnable: state('runnable'),
        _runnableTimeout: runnableTimeout,
        _interval: 16,
        _retries: 0,
        _start: new Date,
        _name: current?.get('name'),
      })

      let { error } = options

      const interval = options.interval ?? options._interval

      // we calculate the total time we've been retrying
      // so we dont exceed the runnables timeout
      const total = new Date - options._start

      options.total = total

      // increment retries
      options._retries += 1

      // if our total exceeds the timeout OR the total + the interval
      // exceed the runnables timeout, then bail
      if ((total + interval) >= options._runnableTimeout) {
        // snapshot the DOM since we are bailing
        // so the user can see the state we're in
        // when we fail
        if (log) {
          log.snapshot()
        }

        const assertions = options.assertions

        if (assertions) {
          finishAssertions(assertions)
        }

        let onFail

        ({ error, onFail } = options)

        const prependMsg = $errUtils.errByPath('miscellaneous.retry_timed_out').message

        const retryErrProps = $errUtils.modifyErrMsg(error, prependMsg, (msg1, msg2) => {
          return `${msg2}${msg1}`
        })

        const retryErr = $errUtils.mergeErrProps(error, retryErrProps)

        $errUtils.throwErr(retryErr, {
          onFail: onFail || log,
        })
      }

      const runnableHasChanged = () => {
        // if we've changed runnables don't retry!
        return options._runnable !== state('runnable')
      }

      const ended = () => {
        // we should NOT retry if
        // 1. our promise has been canceled
        // 2. or we have an error
        // 3. or if the runnables has changed

        // although bluebird SHOULD cancel these retries
        // since they're all connected - apparently they
        // are not and the retry code is happening between
        // runnables which is bad likely due to the issue below
        //
        // bug in bluebird with not propagating cancelations
        // fast enough in a series of promises
        // https://github.com/petkaantonov/bluebird/issues/1424
        return state('canceled') || state('error') || runnableHasChanged()
      }

      return Promise
      .delay(interval)
      .then(() => {
        if (ended()) {
          return
        }

        Cypress.action('cy:command:retry', options)

        if (ended()) {
          return
        }

        // if we are unstable then remove
        // the start since we need to retry
        // fresh once we become stable again!
        if (state('isStable') === false) {
          options._start = undefined
        }

        // invoke the passed in retry fn
        // once we reach stability
        return whenStable(fn)
      })
    },
  }
}

module.exports = {
  create,
}
