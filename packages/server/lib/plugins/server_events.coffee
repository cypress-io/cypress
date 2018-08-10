plugins = require("../plugins")

module.exports = {
  execute: (eventName, args...) ->
    if plugins.has("server:event")
      plugins.execute("server:event", eventName, args...)
}
