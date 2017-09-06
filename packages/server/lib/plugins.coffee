_ = require("lodash")
nodeCache = require("./node_cache")

registeredEvents = {}

register = (event, callback) ->
  if not _.isString(event)
    throw new Error("The plugin register function must be called with an event as its 1st argument. You passed '#{event}'.")

  if not _.isFunction(callback)
    throw new Error("The plugin register function must be called with a callback function as its 2nd argument. You passed '#{callback}'.")

  registeredEvents[event] = callback

module.exports = {
  init: (config) ->
    return if not config.pluginsFile

    registeredEvents = {}

    if nodeCache.has(config.pluginsFile)
      nodeCache.clear(config.pluginsFile)

    try
      plugins = require(config.pluginsFile)
    catch e
      throw new Error("""
        The pluginsFile threw an error when required. Either the file is missing, an exception was thrown by the file, or there is a syntax error in the file.

        pluginsFile: #{config.pluginsFile}

        #{e.stack}
      """)

    if not _.isFunction(plugins)
      throw new Error("The pluginsFile must export a function. Your pluginsFile (#{config.pluginsFile}) exported #{plugins}.")

    plugins(register, config)

  register: register

  has: (event) ->
    !!registeredEvents[event]

  execute: (event, args...) ->
    registeredEvents[event](args...)

  ## for testing purposes
  _reset: ->
    registeredEvents = {}
}
