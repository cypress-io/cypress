import _ from 'lodash'
import Promise from 'bluebird'

import $errUtils from '../../cypress/error_utils'

interface InternalExecOptions extends Partial<Cypress.ExecOptions> {
  _log?: any
  cmd?: string
}

export default (Commands, Cypress, cy) => {
  Commands.addAll({
    exec (cmd: string, options: Partial<Cypress.ExecOptions> = {}) {
      const _options: InternalExecOptions = _.defaults({}, options, {
        log: true,
        timeout: Cypress.config('execTimeout'),
        failOnNonZeroExit: true,
        env: {},
      })

      let consoleOutput

      if (_options.log) {
        consoleOutput = {}

        _options._log = Cypress.log({
          message: _.truncate(cmd, { length: 25 }),
          timeout: _options.timeout,
          consoleProps () {
            return consoleOutput
          },
        })
      }

      if (!cmd || !_.isString(cmd)) {
        $errUtils.throwErrByPath('exec.invalid_argument', {
          onFail: _options._log,
          args: { cmd: cmd ?? '' },
        })
      }

      _options.cmd = cmd

      // need to remove the current timeout
      // because we're handling timeouts ourselves
      cy.clearTimeout()

      return Cypress.backend('exec', _.pick(_options, 'cmd', 'timeout', 'env'))
      .timeout(_options.timeout)
      .then((result) => {
        if (_options._log) {
          _.extend(consoleOutput, { Yielded: _.omit(result, 'shell') })

          consoleOutput['Shell Used'] = result.shell
        }

        if ((result.code === 0) || !_options.failOnNonZeroExit) {
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
          onFail: _options._log,
          args: { cmd, output, code: result.code },
        })
      })
      .catch(Promise.TimeoutError, { timedOut: true }, () => {
        return $errUtils.throwErrByPath('exec.timed_out', {
          onFail: _options._log,
          args: { cmd, timeout: _options.timeout },
        })
      })
      .catch((error) => {
        // re-throw if timedOut error from above
        if (error.name === 'CypressError') {
          throw error
        }

        return $errUtils.throwErrByPath('exec.failed', {
          onFail: _options._log,
          args: { cmd, error },
        })
      })
    },
  })
}
