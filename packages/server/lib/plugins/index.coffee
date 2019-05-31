_ = require("lodash")
cp = require("child_process")
path = require("path")
debug = require("debug")("cypress:server:plugins")
Promise = require("bluebird")
errors = require("../errors")
util = require("./util")

pluginsProcess = null
registeredEvents = {}
handlers = []

register = (event, callback) ->
  debug("register event '#{event}'")

  if not _.isString(event)
    throw new Error("The plugin register function must be called with an event as its 1st argument. You passed '#{event}'.")

  if not _.isFunction(callback)
    throw new Error("The plugin register function must be called with a callback function as its 2nd argument. You passed '#{callback}'.")

  registeredEvents[event] = callback

module.exports = {
  registerHandler: (handler) ->
    handlers.push(handler)

  init: (config, options) ->
    debug("plugins.init", config.pluginsFile)

    new Promise (resolve, reject) ->
      return resolve() if not config.pluginsFile

      if pluginsProcess
        debug("kill existing plugins process")
        pluginsProcess.kill()

      registeredEvents = {}

      pluginsProcess = cp.fork(path.join(__dirname, "child", "index.js"), ["--file", config.pluginsFile], { stdio: "inherit" })
      ipc = util.wrapIpc(pluginsProcess)

      handler(ipc) for handler in handlers

      ipc.send("load", config)

      ipc.on "loaded", (newCfg, registrations) ->
        _.each registrations, (registration) ->
          debug("register plugins process event", registration.event, "with id", registration.eventId)

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

      killPluginsProcess = ->
        pluginsProcess and pluginsProcess.kill()
        pluginsProcess = null

      handleError = (err) ->
        debug("plugins process error:", err.stack)
        killPluginsProcess()
        err = errors.get("PLUGINS_ERROR", err.annotated or err.stack or err.message)
        err.title = "Error running plugin"
        options.onError(err)

      pluginsProcess.on("error", handleError)
      ipc.on("error", handleError)

      ## In linux apparently the child process is never
      ## exiting which causes cypress to hang indefinitely.
      ## It would **SEEM** as if we...
      ## 1. dont need to manually kill our child process
      ##    because it should naturally exit.
      ##    (but of course it doesn't in linux)
      ## 2. use our restore function already defined above.
      ##    however when using the restore function above
      ##    the 'child' reference is null. how is it null?
      ##    it makes no sense. there must be a rip in the
      ##    space time continuum, obviously. that or the
      ##    child reference as the rest of the matter of
      ##    the universe has succumbed to entropy.
      process.on("exit", killPluginsProcess)

  register: register

  has: (event) ->
    isRegistered = !!registeredEvents[event]

    debug("plugin event registered? %o", {
      event,
      isRegistered
    })

    isRegistered

  execute: (event, args...) ->
    debug("execute plugin event '#{event}' with args: %o %o %o", args...)
    registeredEvents[event](args...)

  ## for testing purposes
  _reset: ->
    registeredEvents = {}
    handlers = []
}
