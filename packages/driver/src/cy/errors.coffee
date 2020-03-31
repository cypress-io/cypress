_ = require("lodash")
$dom = require("../dom")
$errUtils = require("../cypress/error_utils")
$stackUtils = require("../cypress/stack_utils")

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
          ret = if $dom.isElement(prev.get("subject"))
            $dom.getElements(prev.get("subject"))
          else
            prev.get("subject")

          obj["Applied To"] = ret
          obj
    })

  createUncaughtException = (type, args) ->
    [msg, source, lineno, colno, err] = args

    ## reset the msg on a cross origin script error
    ## since no details are accessible
    if crossOriginScriptRe.test(msg)
      msg = $errUtils.errByPath("uncaught.cross_origin_script").message

    createErrFromMsg = ->
      $errUtils.errByPath("uncaught.error", {
        msg, source, lineno
      })

    ## if we have the 5th argument it means we're in a modern
    ## browser making this super simple to work with
    err ?= createErrFromMsg()

    uncaughtErr = $errUtils.createUncaughtException(type, err)

    current = state("current")

    uncaughtErr.onFail = ->
      if lastLog = current and current.getLastLog()
        lastLog.error(uncaughtErr)

    return uncaughtErr

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

    commandRunningFailed

    createUncaughtException
  }

module.exports = {
  create
}
