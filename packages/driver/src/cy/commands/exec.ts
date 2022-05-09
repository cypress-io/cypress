import _ from 'lodash'
import Promise from 'bluebird'

import $errUtils from '../../cypress/error_utils'
import type { Log } from '../../cypress/log'

interface InternalExecOptions extends Partial<Cypress.ExecOptions> {
  _log?: Log
  cmd?: string
}

export default (Commands, Cypress, cy) => {
  Commands.addAll({
    exec (cmd: string, userOptions: Partial<Cypress.ExecOptions> = {}) {
      const options: InternalExecOptions = _.defaults({}, userOptions, {
        log: true,
        timeout: Cypress.config('execTimeout'),
        failOnNonZeroExit: true,
        env: {},
      })

      let consoleOutput

      if (options.log) {
        consoleOutput = {}

        options._log = Cypress.log({
          message: _.truncate(cmd, { length: 25 }),
          timeout: options.timeout,
          consoleProps () {
            return consoleOutput
          },
        })
      }

      if (!cmd || !_.isString(cmd)) {
        $errUtils.throwErrByPath('exec.invalid_argument', {
          onFail: options._log,
          args: { cmd: cmd ?? '' },
        })
      }

      options.cmd = cmd

      // need to remove the current timeout
      // because we're handling timeouts ourselves
      cy.clearTimeout()

      return Cypress.backend('exec', _.pick(options, 'cmd', 'timeout', 'env'))
      .timeout(options.timeout)
      .then((result) => {
        if (options._log) {
          _.extend(consoleOutput, { Yielded: _.omit(result, 'shell') })

          consoleOutput['Shell Used'] = result.shell
        }

        if ((result.code === 0) || !options.failOnNonZeroExit) {
          return result
        }

        let output = ''

        if (result.stdout) {
          output += `\nStdout:\n${_.truncate(result.stdout, { length: 200 })}`
        }

        if (result.stderr) {
          output += `\nStderr:\n${_.truncate(result.stderr, { length: 200 })}`
        }

        return $errUtils.throwErrByPath('exec.non_zero_exit', {
          onFail: options._log,
          args: { cmd, output, code: result.code },
        })
      })
      .catch(Promise.TimeoutError, { timedOut: true }, () => {
        return $errUtils.throwErrByPath('exec.timed_out', {
          onFail: options._log,
          args: { cmd, timeout: options.timeout },
        })
      })
      .catch((error) => {
        // re-throw if timedOut error from above
        if (error.name === 'CypressError') {
          throw error
        }

        return $errUtils.throwErrByPath('exec.failed', {
          onFail: options._log,
          args: { cmd, error },
        })
      })
    },
  })
}
