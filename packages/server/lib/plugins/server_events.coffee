Promise = require("bluebird")

errors = require("../errors")
plugins = require("../plugins")

module.exports = {
  execute: (eventName, args...) ->
    if plugins.has("server:event")
      Promise.try ->
        plugins.execute("server:event", eventName, args...)
      .catch (err) ->
        errors.throw("BACKGROUND_SERVER_EVENT_ERROR", eventName, err?.stack or err?.message or err)
}
