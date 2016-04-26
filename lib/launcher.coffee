Promise   = require("bluebird")
launcher  = require("browser-launcher2")
extension = require("@cypress/core-extension")
appData   = require("./util/app_data")

config          = appData.path("browsers", "config.json")
launcher        = Promise.promisify(launcher)
updateBrowsers  = Promise.promisify(launcher.update, {context: launcher})
pathToExtension = extension.getPathToExtension()
instance        = null

process.once "exit", ->
  instance?.stop?()

module.exports = {
  launch: (url, args = []) ->
    ## modify the extension here too
    ## Promise.all([launcher(), modifyExtension()])

    ## TODO:
    ## should we always update here first before
    ## attempting to launch?

    updateBrowsers(config)
    .then ->
      launcher(config)
    .then (launch) ->
      launch = Promise.promisify(launch)

      ## TODO: also handle args passed in from process.argv
      ## like --args ?
      launch(url, {
        browser: "chrome"
        options: [
          "--test-type"
          "--ignore-certificate-errors"
          "--load-and-launch-app=#{pathToExtension}"
          "--disable-popup-blocking"
          "--start-maximized"
          "--disable-password-generation"
          "--disable-save-password-bubble"
          "--disable-single-click-autofill"
          "--disable-prompt-on-repos"
          "--disable-background-timer-throttling"
          "--disable-renderer-throttling"
          "--silent-debugger-extension-api"
        ].concat(args)
      })
    .then (i) ->
      instance = i

}