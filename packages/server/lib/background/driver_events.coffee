errors = require("../errors")
background = require("../background")

module.exports = {
  execute: (eventName, args...) ->
    if background.isRegistered("driver:event")
      background.execute("driver:event", eventName, args...)
      .catch (err) ->
        errors.warning("BACKGROUND_DRIVER_EVENT_ERROR", {
          event: eventName
          error: err?.stack or err
        })
}
