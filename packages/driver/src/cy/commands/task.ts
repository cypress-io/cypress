import _ from 'lodash'
import Promise from 'bluebird'

import $utils from '../../cypress/utils'
import $errUtils from '../../cypress/error_utils'
import $stackUtils from '../../cypress/stack_utils'

interface InternalTaskOptions extends Partial<Cypress.Loggable & Cypress.Timeoutable> {
  _log?: any
}

export default (Commands, Cypress, cy) => {
  Commands.addAll({
    task (task, arg, options: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
      const _options: InternalTaskOptions = _.defaults({}, options, {
        log: true,
        timeout: Cypress.config('taskTimeout'),
      })

      let consoleOutput

      if (_options.log) {
        consoleOutput = {
          task,
          arg,
        }

        let message = task

        if (arg) {
          message += `, ${$utils.stringify(arg)}`
        }

        _options._log = Cypress.log({
          message,
          timeout: _options.timeout,
          consoleProps () {
            return consoleOutput
          },
        })
      }

      if (!task || !_.isString(task)) {
        $errUtils.throwErrByPath('task.invalid_argument', {
          onFail: _options._log,
          args: { task: task || '' },
        })
      }

      // need to remove the current timeout
      // because we're handling timeouts ourselves
      cy.clearTimeout()

      return Cypress.backend('task', {
        task,
        arg,
        timeout: _options.timeout,
      })
      .timeout(_options.timeout)
      .then((result) => {
        if (_options._log) {
          _.extend(consoleOutput, { Yielded: result })
        }

        return result
      })
      .catch(Promise.TimeoutError, () => {
        $errUtils.throwErrByPath('task.timed_out', {
          onFail: _options._log,
          args: { task, timeout: _options.timeout },
        })
      })
      .catch({ timedOut: true }, (error) => {
        $errUtils.throwErrByPath('task.server_timed_out', {
          onFail: _options._log,
          args: { task, timeout: _options.timeout, error: error.message },
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
            onFail: _options._log,
            args: { task, error: err.message },
          })
        }

        $errUtils.throwErrByPath('task.failed', {
          onFail: _options._log,
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
