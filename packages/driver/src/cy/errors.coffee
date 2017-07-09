$utils = require("../cypress/utils")

create = (Cypress, state, config) ->
  return {
    ## submit a generic command error
    commandErr: (err) ->
      current = @state("current")

      @Cypress.Log.command
        end: true
        snapshot: true
        error: err
        consoleProps: ->
          obj = {}
          ## if type isnt parent then we know its dual or child
          ## and we can add Applied To if there is a prev command
          ## and it is a parent
          if current.get("type") isnt "parent" and prev = current.get("prev")
            ret = if $utils.hasElement(prev.get("subject"))
              $utils.getDomElements(prev.get("subject"))
            else
              prev.get("subject")

            obj["Applied To"] = ret
            obj

    checkTestErr: (test) ->
      ## if our test has an error but we dont
      ## have one referenced then set this err
      ## this can happen if there is an window
      ## uncaught error from our test which
      ## bypasses our commands entirely so
      ## we never actually catch it
      ## and 'endedEarlyErr' would fire
      if err = test.err and not @state("err")
        @state("err", err)

      return @

    endedEarlyErr: (index, queue) ->
      ## return if we already have an error
      return if state("err")

      commands = queue.slice(index).reduce (memo, cmd) =>
        if $utils.isCommandFromThenable(cmd) or $utils.isCommandFromMocha(cmd)
          memo
        else
          memo.push "- " + cmd.stringify()
          memo
      , []

      err = $utils.cypressErr(
        $utils.errMessageByPath("miscellaneous.dangling_commands", {
          numCommands: commands.length
          commands:    commands.join('\n')
        })
      )
      err.onFail = ->
      @fail(err)

    fail: (err) ->
      ## make sure we cancel our outstanding
      ## promise since we could have hit this
      ## fail handler outside of a command chain
      ## and we want to ensure we don't continue retrying
      state("promise")?.cancel()

      current = state("current")

      ## allow for our own custom onFail function
      if err.onFail
        err.onFail.call(@, err)

        ## clean up this onFail callback
        ## after its been called
        delete err.onFail
      else
        @commandErr(err)

      runnable = state("runnable")

      state("err", err)

      Cypress.action("errors:fail", err, runnable)
      # @Cypress.trigger "fail", err, runnable
      # @trigger "fail", err, runnable
    }

module.exports = {
  create
}
