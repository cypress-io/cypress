_ = require("lodash")
Promise = require("bluebird")

$utils = require("../../cypress/utils")
$errUtils = require("../../cypress/error_utils")

module.exports = (Commands, Cypress, cy, state, config) ->
  Commands.addAll({
    task: (task, arg, options = {}) ->
      _.defaults options,
        log: true
        timeout: Cypress.config("taskTimeout")

      if options.log
        consoleOutput = {
          task: task
          arg: arg
        }

        message = task
        if arg
          message += ", #{$utils.stringify(arg)}"

        options._log = Cypress.log({
          message: message
          consoleProps: ->
            consoleOutput
        })

      if not task or not _.isString(task)
        $errUtils.throwErrByPath("task.invalid_argument", {
          onFail: options._log,
          args: { task: task ? "" }
        })

      ## need to remove the current timeout
      ## because we're handling timeouts ourselves
      cy.clearTimeout()

      Cypress.backend("task", {
        task: task
        arg: arg
        timeout: options.timeout
      })
      .timeout(options.timeout)
      .then (result) ->
        if options._log
          _.extend(consoleOutput, { Yielded: result })
        return result

      .catch Promise.TimeoutError, ->
        $errUtils.throwErrByPath "task.timed_out", {
          onFail: options._log
          args: { task, timeout: options.timeout }
        }

      .catch { timedOut: true }, (error) ->
        $errUtils.throwErrByPath "task.server_timed_out", {
          onFail: options._log
          args: { task, timeout: options.timeout, error: error.message }
        }

      .catch (error) ->
        ## re-throw if timedOut error from above
        throw error if error.name is "CypressError"

        $errUtils.normalizeErrorStack(error)

        if error?.isKnownError
          $errUtils.throwErrByPath("task.known_error", {
            onFail: options._log
            args: { task, error: error.message }
          })

        $errUtils.throwErrByPath("task.failed", {
          onFail: options._log
          args: { task, error: error?.stack or error?.message or error }
        })
  })
