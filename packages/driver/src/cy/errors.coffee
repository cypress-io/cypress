_ = require("lodash")
$dom = require("../dom")
$errUtils = require("../cypress/error_utils")
$errorMessages = require('../cypress/error_messages')

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

    current = state("current")

    ## reset the msg on a cross origin script error
    ## since no details are accessible
    if crossOriginScriptRe.test(msg)
      msg = $errUtils.errMsgByPath("uncaught.cross_origin_script")

    createErrFromMsg = ->
      new Error($errUtils.errMsgByPath("uncaught.error", {
        msg, source, lineno
      }))

    ## if we have the 5th argument it means we're in a super
    ## modern browser making this super simple to work with.
    err ?= createErrFromMsg()

    uncaughtErrLookup = switch type
      when "app" then "uncaught.fromApp"
      when "spec" then "uncaught.fromSpec"

    uncaughtErrObj = $errUtils.errObjByPath($errorMessages, uncaughtErrLookup)

    err.name = "Uncaught " + err.name

    uncaughtErrProps = $errUtils.modifyErrMsg(err, uncaughtErrObj.message, (msg1, msg2) ->
      return "#{msg1}\n\n#{msg2}"
    )
    _.defaults(uncaughtErrProps, uncaughtErrObj)

    uncaughtErr = $errUtils.mergeErrProps(err, uncaughtErrProps)

    uncaughtErr.onFail = ->
      if l = current and current.getLastLog()
        l.error(uncaughtErr)

    ## normalize error message for firefox
    $errUtils.normalizeErrorStack(uncaughtErr)

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
