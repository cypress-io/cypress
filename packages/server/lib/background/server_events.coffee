Promise = require("bluebird")

errors = require("../errors")
background = require("../background")

module.exports = {
  execute: (eventName, args...) ->
    if background.isRegistered("server:event")
      Promise.try ->
        background.execute("server:event", eventName, args...)
      .catch (err) ->
        errors.throw("BACKGROUND_SERVER_EVENT_ERROR", eventName, err?.stack or err?.message or err)
}
