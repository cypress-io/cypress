const _ = require('lodash')
const Promise = require('bluebird')
const debug = require('debug')('cypress:driver:retries')

const $errUtils = require('../cypress/error_utils')

const create = (Cypress, state, timeout, clearTimeout, whenStable, finishAssertions) => {
  return {
    async retry (fn, options, log) {
    // remove the runnables timeout because we are now in retry
    // mode and should be handling timing out ourselves and dont
    // want to accidentally time out via mocha
      let runnableTimeout; let total

      if (!options._runnableTimeout) {
        runnableTimeout = options.timeout != null ? options.timeout : timeout()
        clearTimeout()
      }

      const current = state('current')

      // use the log if passed in, else fallback to options._log
      // else fall back to just grabbing the last log per our current command
      if (log == null) {
        log = options._log != null ? options._log : (current != null ? current.getLastLog() : undefined)
      }

      _.defaults(options, {
        _runnable: state('runnable'),
        _runnableTimeout: runnableTimeout,
        _interval: 16,
        _retries: 0,
        _start: new Date,
        _name: (current != null ? current.get('name') : undefined),
      })

      let { error } = options

      // TODO: remove this once the codeframe PR is in since that
      // correctly handles not rewrapping errors so that stack
      // traces are correctly displayed
      if (debug.enabled && error && !$errUtils.CypressErrorRe.test(error.name)) {
        debug('retrying due to caught error...')
        // eslint-disable-next-line no-console
        console.error(error)
      }

      const interval = options.interval != null ? options.interval : options._interval

      // we calculate the total time we've been retrying
      // so we dont exceed the runnables timeout
      options.total = (total = (new Date - options._start))

      // increment retries
      options._retries += 1

      // if our total exceeds the timeout OR the total + the interval
      // exceed the runnables timeout, then bail
      if ((total + interval) >= options._runnableTimeout) {
      // snapshot the DOM since we are bailing
      // so the user can see the state we're in
      // when we fail
        let assertions; let onFail

        if (log) {
          log.snapshot()
        }

        assertions = options.assertions

        if (assertions) {
          finishAssertions(assertions)
        }

        ({ error, onFail } = options)

        const prependMsg = $errUtils.errMsgByPath('miscellaneous.retry_timed_out')

        const retryErrProps = $errUtils.modifyErrMsg(error, prependMsg, (msg1, msg2) => `${msg2}${msg1}`)

        const retryErr = $errUtils.mergeErrProps(error, retryErrProps)

        $errUtils.throwErr(retryErr, {
          onFail: onFail || log,
        })
      }

      // if we've changed runnables don't retry!
      const runnableHasChanged = () => {
        return options._runnable !== state('runnable')
      }

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
      const ended = () => {
        return state('canceled') || state('error') || runnableHasChanged()
      }

      await Promise
      .delay(interval)

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
    },
  }
}

module.exports = {
  create,
}
