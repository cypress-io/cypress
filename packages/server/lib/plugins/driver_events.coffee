plugins = require("../plugins")

module.exports = {
  execute: (eventName, args...) ->
    if plugins.has("driver:event")
      plugins.execute("driver:event", eventName, args...)
}
