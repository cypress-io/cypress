_ = require("lodash")
Promise = require("bluebird")

$errUtils = require("../../cypress/error_utils")

module.exports = (Commands, Cypress, cy, state, config) ->
  Commands.addAll({
    exec: (cmd, options = {}) ->
      _.defaults options,
        log: true
        timeout: Cypress.config("execTimeout")
        failOnNonZeroExit: true
        env: {}

      if options.log
        consoleOutput = {}

        options._log = Cypress.log({
          message: _.truncate(cmd, { length: 25 })
          consoleProps: ->
            consoleOutput
        })

      if not cmd or not _.isString(cmd)
        $errUtils.throwErrByPath("exec.invalid_argument", {
          onFail: options._log,
          args: { cmd: cmd ? '' }
        })

      options.cmd = cmd

      ## need to remove the current timeout
      ## because we're handling timeouts ourselves
      cy.clearTimeout()

      Cypress.backend("exec", _.pick(options, "cmd", "timeout", "env"))
      .timeout(options.timeout)
      .then (result) ->
        if options._log
          _.extend(consoleOutput, { Yielded: _.omit(result, "shell") })

          consoleOutput["Shell Used"] = result.shell

        return result if result.code is 0 or not options.failOnNonZeroExit

        output = ""
        output += "\nStdout:\n#{_.truncate(result.stdout, { length: 200 })}" if result.stdout
        output += "\nStderr:\n#{_.truncate(result.stderr, { length: 200 })}" if result.stderr

        $errUtils.throwErrByPath "exec.non_zero_exit", {
          onFail: options._log
          args: { cmd, output, code: result.code }
        }

      .catch Promise.TimeoutError, { timedOut: true }, (err) ->
        $errUtils.throwErrByPath "exec.timed_out", {
          onFail: options._log
          args: { cmd, timeout: options.timeout }
        }

      .catch (error) ->
        ## re-throw if timedOut error from above
        throw error if error.name is "CypressError"

        $errUtils.throwErrByPath("exec.failed", {
          onFail: options._log
          args: { cmd, error }
        })
  })
