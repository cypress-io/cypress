import _ from 'lodash'
import Promise from 'bluebird'

import $errUtils, { CypressError } from '../cypress/error_utils'
import type { ICypress } from '../cypress'
import type { $Cy } from '../cypress/cy'
import type { StateFunc } from '../cypress/state'
import type { Log } from '../cypress/log'

const { errByPath, modifyErrMsg, throwErr, mergeErrProps } = $errUtils

type retryOptions = {
  _interval?: number
  _log?: Log
  _retries?: number
  _runnable?: any
  _runnableTimeout?: number
  _start?: Date
  error?: CypressError
  interval: number
  log: boolean
  onFail?: Function
  timeout: number
  total?: number
}

// eslint-disable-next-line @cypress/dev/arrow-body-multiline-braces
export const create = (Cypress: ICypress, state: StateFunc, timeout: $Cy['timeout'], clearTimeout: $Cy['clearTimeout'], whenStable: $Cy['whenStable'], finishAssertions: (err?: Error) => void) => ({
  retry (fn, options: retryOptions, log?) {
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
    // so we don't exceed the runnables timeout
    const total = Date.now().valueOf() - options._start!.valueOf()

    options.total = total

    // increment retries
    options._retries! += 1

    // if our total exceeds the timeout OR the total + the interval
    // exceed the runnables timeout, then bail
    if ((total + interval) >= options._runnableTimeout!) {
      let onFail

      ({ error, onFail } = options)

      const prependMsg = error?.retry === false ? '' : errByPath('miscellaneous.retry_timed_out', {
        ms: options._runnableTimeout,
      }).message

      const retryErrProps = modifyErrMsg(error, prependMsg, (msg1, msg2) => {
        return `${msg2}${msg1}`
      })

      if (error) {
        const retryErr = mergeErrProps(error, retryErrProps)

        throwErr(retryErr, {
          onFail: (err) => {
            if (onFail) {
              err = onFail(err)
            }

            finishAssertions(err)
          },
        })
      }
    }

    const runnableHasChanged = () => {
      // if we've changed runnables don't retry!
      return options._runnable !== state('runnable')
    }

    const ended = () => {
      // we should NOT retry if
      // 1. our promise has been canceled
      // 2. or if the runnables has changed

      // although bluebird SHOULD cancel these retries
      // since they're all connected - apparently they
      // are not and the retry code is happening between
      // runnables which is bad likely due to the issue below
      //
      // bug in bluebird with not propagating cancellations
      // fast enough in a series of promises
      // https://github.com/petkaantonov/bluebird/issues/1424
      return state('canceled') || runnableHasChanged()
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
  retryIfCommandAUTOriginMismatch (fn: () => any, timeout: number) {
    const options: retryOptions = {
      log: true,
      timeout,
      interval: 100,
    }

    const retryValue = () => {
      return Promise
      .try(() => {
        // If command is not same origin, this will throw an error. also, in this instance, this is cy
        // @ts-ignore
        Cypress.ensure.commandCanCommunicateWithAUT(cy)
      })
      .catch((err) => {
        options.error = err

        return this.retry(retryValue, options)
      })
    }

    return retryValue().then(() => {
      return fn()
    })
  },
})

export interface IRetries extends ReturnType<typeof create> {}
