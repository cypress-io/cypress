debug = require("debug")("cypress:e2e")
module.exports = (onFn, config) ->
  debug("plugin file %s", __filename)
  debug("received config with browsers %o", config.browsers)

  if not Array.isArray(config.browsers)
    throw new Error("Expected list of browsers in the config")
  if config.browsers.length == 0
    throw new Error("Expected at least 1 browser in the config")
  electronBrowser = config.browsers.find (browser) -> browser.name == "electron"
  if not electronBrowser
    throw new Error("List of browsers passed into plugins does not include Electron browser")

  changedConfig = {
    browsers: [electronBrowser]
  }
  debug("returning only Electron browser from plugins %o", changedConfig)
  return changedConfig
