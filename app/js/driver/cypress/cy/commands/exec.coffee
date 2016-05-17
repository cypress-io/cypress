$Cypress.register "Exec", (Cypress, _, $, Promise) ->

  exec = (options) =>
    new Promise (resolve, reject) ->
      Cypress.trigger "exec", options, (resp) ->
        if err = resp.__error
          err.timedout = resp.timedout
          reject(err)
        else
          resolve(resp)

  Cypress.addParentCommand
    exec: (cmd, options = {}) ->
      _.defaults options,
        log: true
        timeout: Cypress.config("execTimeout")
        failOnNonZeroExit: true
        env: {}

      if options.log
        options._log = Cypress.Log.command({
          message: _.truncate(cmd, 25)
        })

      if not cmd or not _.isString(cmd)
        $Cypress.Utils.throwErrByPath("exec.invalid_argument", {
          onFail: options._log,
          args: { cmd: cmd ? '' }
        })

      options.cmd = cmd

      ## need to remove the current timeout
      ## because we're handling timeouts ourselves
      @_clearTimeout()

      isTimedoutError = (err)-> err.timedout

      exec(_.pick(options, "cmd", "timeout", "env"))
      .timeout(options.timeout)
      .then (result) ->
        return result if result.code is 0 or not options.failOnNonZeroExit

        output = ""
        output += "\nStdout:\n#{result.stdout}\n" if result.stdout
        output += "Stderr:\n#{result.stderr}" if result.stderr
        $Cypress.Utils.throwErrByPath "exec.non_zero_exit", {
          onFail: options._log
          args: { cmd, output, code: result.code }
        }

      .catch Promise.TimeoutError, isTimedoutError, (err) ->
        $Cypress.Utils.throwErrByPath "exec.timed_out", {
          onFail: options._log
          args: { cmd, timeout: options.timeout }
        }

      .catch (error) ->
        ## re-throw if timedout error from above
        throw error if error.name is "CypressError"

        $Cypress.Utils.throwErrByPath("exec.failed", {
          onFail: options._log
          args: { cmd, error }
        })
