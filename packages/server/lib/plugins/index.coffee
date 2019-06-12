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

      childIndexFilename = path.join(__dirname, "child", "index.js")
      childArguments = ["--file", config.pluginsFile]
      childOptions = {
        stdio: "inherit"
      }

      # if we need to find Node and use it to fork the child process
      # find it asynchronously
      decidedChildOptions = null

      if config.node
        decidedChildOptions = util.findNode(config.node)
          .then (resolvedNode) ->
            if resolvedNode
              debug("using Node %s", resolvedNode)
              childOptions.execPath = resolvedNode
            else
              console.error("Could not find Node from config %s, using bundled Node %s", config.node, process.version)
      else
        decidedChildOptions = Promise.resolve()

      decidedChildOptions.then () ->
        pluginsProcess = cp.fork(childIndexFilename, childArguments, childOptions)
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

        ## see timers/parent.js line #93 for why this is necessary
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
    debug("execute plugin event '#{event}' Node '#{process.version}' with args: %o %o %o", args...)
    registeredEvents[event](args...)

  ## for testing purposes
  _reset: ->
    registeredEvents = {}
    handlers = []
}
