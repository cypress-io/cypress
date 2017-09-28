fs        = require("fs-extra")
Promise   = require("bluebird")
extension = require("@packages/extension")
log       = require("debug")("cypress:server:browsers")
appData   = require("../util/app_data")
utils     = require("./utils")

fs = Promise.promisifyAll(fs)

pathToExtension = extension.getPathToExtension()
pathToTheme     = extension.getPathToTheme()

defaultArgs = [
  "--test-type"
  "--ignore-certificate-errors"
  "--start-maximized"
  "--silent-debugger-extension-api"
  "--no-default-browser-check"
  "--no-first-run"
  "--noerrdialogs"
  "--enable-fixed-layout"
  "--disable-popup-blocking"
  "--disable-password-generation"
  "--disable-save-password-bubble"
  "--disable-single-click-autofill"
  "--disable-prompt-on-repos"
  "--disable-background-timer-throttling"
  "--disable-renderer-backgrounding"
  "--disable-renderer-throttling"
  "--disable-restore-session-state"
  "--disable-translate"
  "--disable-new-profile-management"
  "--disable-new-avatar-menu"
  "--allow-insecure-localhost"
  "--reduce-security-for-testing"
  "--enable-automation"
  "--disable-infobars"

  ## the following come frome chromedriver
  ## https://code.google.com/p/chromium/codesearch#chromium/src/chrome/test/chromedriver/chrome_launcher.cc&sq=package:chromium&l=70
  "--metrics-recording-only"
  "--disable-prompt-on-repost"
  "--disable-hang-monitor"
  "--disable-sync"
  "--disable-background-networking"
  "--disable-web-resources"
  "--safebrowsing-disable-auto-update"
  "--safebrowsing-disable-download-protection"
  "--disable-client-side-phishing-detection"
  "--disable-component-update"
  "--disable-default-apps"
]

module.exports = {
  _writeExtension: (proxyUrl, socketIoRoute) ->
    ## get the string bytes for the final extension file
    extension.setHostAndPath(proxyUrl, socketIoRoute)
    .then (str) ->
      extensionDest = appData.path("extensions", "chrome")
      extensionBg   = appData.path("extensions", "chrome", "background.js")

      ## copy the extension src to the extension dist
      utils.copyExtension(pathToExtension, extensionDest)
      .then ->
        ## and overwrite background.js with the final string bytes
        fs.writeFileAsync(extensionBg, str)
      .return(extensionDest)

  open: (browserName, url, options = {}, automation) ->
    args = defaultArgs.concat(options.browserArgs)

    Promise.all([
      ## ensure that we have a chrome profile dir
      utils.ensureProfile(browserName)

      @_writeExtension(options.proxyUrl, options.socketIoRoute)
    ])
    .spread (dir, dest) ->
      ## we now know where this extension is going
      args.push("--load-extension=#{dest},#{pathToTheme}")

      ## this overrides any previous user-data-dir args
      ## by being the last one
      args.push("--user-data-dir=#{dir}")

      if ps = options.proxyServer
        args.push("--proxy-server=#{ps}")

      if options.chromeWebSecurity is false
        args.push("--disable-web-security")
        args.push("--allow-running-insecure-content")

      log("launch in chrome: %s, %s", url, args)
      utils.launch(browserName, url, args)
}
