import _ from 'lodash'
import Promise from 'bluebird'

import $errUtils from '../../cypress/error_utils'
import type { Log } from '../../cypress/log'
import { runPrivilegedCommand } from '../../util/privileged_channel'

interface InternalExecOptions extends Partial<Cypress.ExecOptions> {
  _log?: Log
  cmd?: string
  timeout: number
}

export default (Commands, Cypress, cy) => {
  Commands.addAll({
    exec (cmd: string, userOptions: Partial<Cypress.ExecOptions>, ...extras: never[]) {
      userOptions = userOptions || {}

      const options: InternalExecOptions = _.defaults({}, userOptions, {
        log: true,
        timeout: Cypress.config('execTimeout') as number,
        failOnNonZeroExit: true,
        env: {},
      })

      let consoleOutput

      consoleOutput = {}

      options._log = Cypress.log({
        message: _.truncate(cmd, { length: 25 }),
        hidden: options.log === false,
        timeout: options.timeout,
        consoleProps () {
          return consoleOutput
        },
      })

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

      return runPrivilegedCommand({
        commandName: 'exec',
        cy,
        Cypress: (Cypress as unknown) as InternalCypress.Cypress,
        options: _.pick(options, 'cmd', 'timeout', 'env'),
      })
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
        $errUtils.throwErrByPath('exec.timed_out', {
          onFail: options._log,
          args: { cmd, timeout: options.timeout },
        })
      })
      .catch((err) => {
        // re-throw if timedOut error from above
        if (err.name === 'CypressError') {
          throw err
        }

        if (err.isNonSpec) {
          $errUtils.throwErrByPath('miscellaneous.non_spec_invocation', {
            args: { cmd: 'exec' },
          })
        }

        $errUtils.throwErrByPath('exec.failed', {
          onFail: options._log,
          args: { cmd, error: err },
        })
      })
    },
  })
}
