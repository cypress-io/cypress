_             = require("lodash")
fs            = require("fs-extra")
path          = require("path")
Promise       = require("bluebird")
# electron      = require("electron")
# contextMenu   = require("electron-context-menu")
launcher      = require("@cypress/core-launcher")
# extension     = require("@cypress/core-extension")
# appData       = require("./util/app_data")
savedState    = require("../saved_state")
utils         = require("./utils")
# electronUtils = require("./gui/utils")
# menu          = require("./gui/menu")
# automation    = require("./gui/automation")
# Renderer      = require("./gui/renderer")

fs              = Promise.promisifyAll(fs)
# profiles        = appData.path("browsers")
# pathToExtension = extension.getPathToExtension()
# pathToTheme     = extension.getPathToTheme()
instance        = null
currentBrowser  = null

kill = (unbind) ->
  ## cleanup our running browser
  ## instance
  return if not instance

  if unbind
    instance.removeAllListeners()
  instance.kill()
  instance = null
  currentBrowser = null

process.once "exit", kill

browsers = {
  chrome:   require("./chrome")
  electron: require("./electron")
}

module.exports = {
  get: utils.getBrowsers

  launch: utils.launch

  close: kill

  open: (name, automation, config = {}, options = {}) ->
    if not browser = browsers[name]
      keys = _.keys(browsers).join(", ")
      throw new Error("Browser: #{name} has not been added. Available browsers are: #{keys}")

    if not url = options.url
      throw new Error("options.url must be provided when opening a browser. You passed:", options)

    browser.open(url, automation, config, options)
    .then (i) ->
      instance = i

      ## TODO: normalizing opening and closing / exiting
      ## so that there is a default for each browser but
      ## enable the browser to configure the interface

      # instance.once "exit", ->
      #   options.onBrowserClose()

      # ## TODO: instead of waiting an arbitrary
      # ## amount of time here we could instead
      # ## wait for the socket.io connect event
      # ## which would mean that our browser is
      # ## completely rendered and open. that would
      # ## mean moving this code out of here and
      # ## into the project itself
      # ## (just like headless code)
      # ## ----------------------------
      # ## give a little padding around
      # ## the browser opening
      # Promise.delay(1000)
      # .then ->
      #   options.onBrowserOpen()

      #   return instance

}
