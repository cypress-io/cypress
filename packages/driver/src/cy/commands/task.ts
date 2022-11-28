import _ from 'lodash'
import Promise from 'bluebird'

import $utils from '../../cypress/utils'
import $errUtils from '../../cypress/error_utils'
import $stackUtils from '../../cypress/stack_utils'
import type { Log } from '../../cypress/log'

interface InternalTaskOptions extends Partial<Cypress.Loggable & Cypress.Timeoutable> {
  _log?: Log
}

export default (Commands, Cypress, cy) => {
  Commands.addAll({
    task (task, arg, userOptions: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
      const options: InternalTaskOptions = _.defaults({}, userOptions, {
        log: true,
        timeout: Cypress.config('taskTimeout'),
      })

      let consoleOutput

      if (options.log) {
        consoleOutput = {
          task,
          arg,
        }

        let message = task

        if (arg) {
          message += `, ${$utils.stringify(arg)}`
        }

        options._log = Cypress.log({
          message,
          timeout: options.timeout,
          consoleProps () {
            return consoleOutput
          },
        })
      }

      if (!task || !_.isString(task)) {
        $errUtils.throwErrByPath('task.invalid_argument', {
          onFail: options._log,
          args: { task: task || '' },
        })
      }

      // need to remove the current timeout
      // because we're handling timeouts ourselves
      cy.clearTimeout()

      return Cypress.backend('task', {
        task,
        arg,
        timeout: options.timeout,
      })
      .timeout(options.timeout)
      .then((result) => {
        if (options._log) {
          _.extend(consoleOutput, { Yielded: result })
        }

        return result
      })
      .catch(Promise.TimeoutError, () => {
        $errUtils.throwErrByPath('task.timed_out', {
          onFail: options._log,
          args: { task, timeout: options.timeout },
        })
      })
      .catch({ timedOut: true }, (error) => {
        $errUtils.throwErrByPath('task.server_timed_out', {
          onFail: options._log,
          args: { task, timeout: options.timeout, error: error.message },
        })
      })
      .catch((err) => {
        // re-throw if timedOut error from above
        if ($errUtils.isCypressErr(err)) {
          throw err
        }

        err.stack = $stackUtils.normalizedStack(err)

        if (err?.isKnownError) {
          $errUtils.throwErrByPath('task.known_error', {
            onFail: options._log,
            args: { task, error: err.message },
          })
        }

        $errUtils.throwErrByPath('task.failed', {
          onFail: options._log,
          args: { task, error: err?.message || err },
          errProps: {
            appendToStack: {
              title: 'From Node.js Internals',
              content: err?.stack || err,
            },
          },
        })
      })
    },
  })
}
