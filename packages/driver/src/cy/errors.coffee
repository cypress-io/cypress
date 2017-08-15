$utils = require("../cypress/utils")

crossOriginScriptRe = /^script error/i

create = (state, config, log) ->
  commandErr = (err) ->
    current = state("current")

    log({
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
    })

  endedEarlyErr = (index, queue) ->
    ## return if we already have an error
    return if state("error")

    commands = queue.slice(index).reduce (memo, cmd) =>
      if $utils.isCommandFromThenable(cmd)
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

    commandRunningFailed(err)

  createUncaughtException = (msg, source, lineno, colno, err) ->
    current = state("current")

    ## reset the msg on a cross origin script error
    ## since no details are accessible
    if crossOriginScriptRe.test(msg)
      msg = $utils.errMessageByPath("uncaught.cross_origin_script")

    createErrFromMsg = ->
      new Error $utils.errMessageByPath("uncaught.error", { msg, source, lineno })

    ## if we have the 5th argument it means we're in a super
    ## modern browser making this super simple to work with.
    err ?= createErrFromMsg()

    err.name = "Uncaught " + err.name

    err.onFail = ->
      if l = current and current.getLastLog()
        l.error(err)

    return err

  commandRunningFailed = (err) ->
    ## allow for our own custom onFail function
    if err.onFail
      err.onFail(err)

      ## clean up this onFail callback
      ## after its been called
      delete err.onFail
    else
      commandErr(err)

  return {
    ## submit a generic command error
    commandErr

    endedEarlyErr

    commandRunningFailed

    createUncaughtException
  }

module.exports = {
  create
}
