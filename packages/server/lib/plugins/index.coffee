_ = require("lodash")
cp = require("child_process")
path = require("path")
log = require("debug")("cypress:server:plugins")
Promise = require("bluebird")
errors = require("../errors")
util = require("./util")

pluginsProcess = null
registeredEvents = {}
handlers = []

register = (event, callback) ->
  log("register event '#{event}'")

  if not _.isString(event)
    throw new Error("The plugin register function must be called with an event as its 1st argument. You passed '#{event}'.")

  if not _.isFunction(callback)
    throw new Error("The plugin register function must be called with a callback function as its 2nd argument. You passed '#{callback}'.")

  registeredEvents[event] = callback

module.exports = {
  registerHandler: (handler) ->
    handlers.push(handler)

  init: (config, options) ->
    log("plugins.init", config.pluginsFile)

    new Promise (resolve, reject) ->
      return resolve() if not config.pluginsFile

      if pluginsProcess
        log("kill existing plugins process")
        pluginsProcess.kill()

      registeredEvents = {}

      pluginsProcess = cp.fork(path.join(__dirname, "child", "index.js"), ["--file", config.pluginsFile])
      ipc = util.wrapIpc(pluginsProcess)

      handler(ipc) for handler in handlers

      ipc.send("load", config)

      ipc.on "loaded", (newCfg, registrations) ->
        _.each registrations, (registration) ->
          log("register plugins process event", registration.event, "with id", registration.callbackId)
          register registration.event, (args...) ->
            util.wrapParentPromise ipc, registration.callbackId, (invocationId) ->
              log("call event", registration.event, "for invocation id", invocationId)
              ids = {
                callbackId: registration.callbackId
                invocationId: invocationId
              }
              ipc.send("execute", registration.event, ids, args)

        resolve(newCfg)

      ipc.on "load:error", (type, args...) ->
        reject(errors.get(type, args...))

      killPluginsProcess = ->
        pluginsProcess and pluginsProcess.kill()
        pluginsProcess = null

      handleError = (err) ->
        log("plugins process error:", err.stack)
        killPluginsProcess()
        err = errors.get("PLUGINS_ERROR", err.annotated or err.stack or err.message)
        err.title = "Error running plugin"
        options.onError(err)

      pluginsProcess.on("error", handleError)
      ipc.on("error", handleError)

      ## see timers/parent.js line #93 for why this is necessary
      process.on("exit", killPluginsProcess)

  register: register

  has: (event) ->
    !!registeredEvents[event]

  execute: (event, args...) ->
    log("execute plugin event '#{event}' with args: %s", args...)
    registeredEvents[event](args...)

  ## for testing purposes
  _reset: ->
    registeredEvents = {}
    handlers = []
}
