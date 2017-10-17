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
      errors.throw("PLUGINS_DIDNT_EXPORT_FUNCTION", config.pluginsFile, plugins)

    log("call the plugins function")

    try
      plugins(register, config)
    catch e
      log("pluginsFile threw an error:", e.stack)
      errors.throw("PLUGINS_FUNCTION_ERROR", config.pluginsFile, e.stack)

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
