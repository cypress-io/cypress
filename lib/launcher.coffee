Promise   = require("bluebird")
launcher  = require("browser-launcher2")
extension = require("@cypress/core-extension")

launcher        = Promise.promisify(launcher)
pathToExtension = extension.getPathToExtension()

module.exports = {
  launch: (url) ->
    launcher()
    .then (launch) ->
      launch = Promise.promisify(launch)

      launch(url, {
        browser: "chrome"
        options: [
          url
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
        ]
      })

}