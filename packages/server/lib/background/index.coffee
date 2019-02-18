_ = require("lodash")
cp = require("child_process")
path = require("path")
debug = require("debug")("cypress:server:background")
Promise = require("bluebird")
errors = require("../errors")
util = require("./util")

backgroundProcess = null
registeredEvents = {}
handlers = []

renamedEvents = {
  "file:preprocessor": "browser:filePreprocessor"
  "before:browser:launch": "browser:launch"
  "after:screenshot": "screenshot"
}

getRenamedEvents = (registrations) ->
  _(registrations)
  .map ({ event }) -> { oldEvent: event, newEvent: renamedEvents[event] }
  .filter ({ newEvent }) -> !!newEvent
  .value()

register = (event, callback) ->
  debug("register event '#{event}'")

  if not _.isString(event)
    throw new Error("The background register function must be called with an event as its 1st argument. You passed '#{event}'.")

  if not _.isFunction(callback)
    throw new Error("The background register function must be called with a callback function as its 2nd argument. You passed '#{callback}'.")

  registeredEvents[event] = callback

module.exports = {
  registerHandler: (handler) ->
    handlers.push(handler)

  init: (config, options) ->
    debug("background.init", config.backgroundFile)

    new Promise (resolve, reject) ->
      return resolve() if not config.backgroundFile

      if backgroundProcess
        debug("kill existing background process")
        backgroundProcess.kill()

      registeredEvents = {}

      backgroundProcess = cp.fork(path.join(__dirname, "child", "index.js"), ["--file", config.backgroundFile], { stdio: "inherit" })
      ipc = util.wrapIpc(backgroundProcess)

      handler(ipc) for handler in handlers

      ipc.send("load", config)

      ipc.on "loaded", (newCfg, registrations) ->
        renamed = getRenamedEvents(registrations)
        if renamed.length
          reject(errors.get("BACKGROUND_RENAMED_EVENTS", {
            backgroundFile: config.backgroundFile
            events: renamed
          }))

        _.each registrations, (registration) ->
          debug("register background process event", registration.event, "with id", registration.eventId)

          register registration.event, (args...) ->
            util.wrapParentPromise ipc, registration.eventId, (invocationId) ->
              debug("call event", registration.event, "for invocation id", invocationId)
              ids = {
                eventId: registration.eventId
                invocationId: invocationId
              }
              ipc.send("execute", registration.event, ids, args)

        resolve(newCfg)

      ipc.on "load:error", (type, args...) ->
        reject(errors.get(type, args...))

      killbackgroundProcess = ->
        backgroundProcess and backgroundProcess.kill()
        backgroundProcess = null

      handleError = (err) ->
        debug("background process error:", err.stack)
        killbackgroundProcess()
        err = errors.get("BACKGROUND_ERROR", err.annotated or err.stack or err.message)
        err.title = "Error running background plugin"
        options.onError(err)

      backgroundProcess.on("error", handleError)
      ipc.on("error", handleError)

      ## see timers/parent.js line #93 for why this is necessary
      process.on("exit", killbackgroundProcess)

  register: register

  isRegistered: (event) ->
    isRegistered = !!registeredEvents[event]

    debug("background event registered? %o", {
      event,
      isRegistered
    })

    isRegistered

  execute: (event, args...) ->
    debug("execute background event '#{event}' with args: %o %o %o", args...)

    if backgroundProcess
      registeredEvents[event](args...)
    else
      debug("background process killed - don't execute")

  ## for testing purposes
  _reset: ->
    backgroundProcess = null
    registeredEvents = {}
    handlers = []
}
