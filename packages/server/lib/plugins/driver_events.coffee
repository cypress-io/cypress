errors = require("../errors")
plugins = require("../plugins")

module.exports = {
  execute: (eventName, args...) ->
    if plugins.has("driver:event")
      plugins.execute("driver:event", eventName, args...)
      .catch (err) ->
        errors.warning("BACKGROUND_DRIVER_EVENT_ERROR", {
          event: eventName
          error: err?.stack or err
        })
}
