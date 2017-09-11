_ = require("lodash")
log = require("debug")("cypress:server:plugins")
errors = require("./errors")
nodeCache = require("./node_cache")

registeredEvents = {}

register = (event, callback) ->
  log("register event '#{event}'")

  if not _.isString(event)
    throw new Error("The plugin register function must be called with an event as its 1st argument. You passed '#{event}'.")

  if not _.isFunction(callback)
    throw new Error("The plugin register function must be called with a callback function as its 2nd argument. You passed '#{callback}'.")

  registeredEvents[event] = callback

module.exports = {
  init: (config) ->
    log("plugins.init '%s'", config.pluginsFile)

    return if not config.pluginsFile

    registeredEvents = {}

    if nodeCache.has(config.pluginsFile)
      log("has cached plugin, clear it")
      nodeCache.clear(config.pluginsFile)

    try
      log("require pluginsFile")
      plugins = nodeCache.require(config.pluginsFile)
    catch e
      log("failed to require pluginsFile:\n%s", e.stack)
      errors.throw("PLUGINS_FILE_ERROR", config.pluginsFile, e.stack)

    if not _.isFunction(plugins)
      throw new Error("The pluginsFile must export a function. Your pluginsFile (#{config.pluginsFile}) exported #{plugins}.")

    log("call the plugins function")
    plugins(register, config)

  register: register

  has: (event) ->
    !!registeredEvents[event]

  execute: (event, args...) ->
    log("execute plugin event '#{event}' with args: %s", args...)
    registeredEvents[event](args...)

  ## for testing purposes
  _reset: ->
    registeredEvents = {}
}
