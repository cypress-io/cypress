_         = require("lodash")
fs        = require("fs-extra")
path      = require("path")
Promise   = require("bluebird")
launcher  = require("@cypress/core-launcher")
extension = require("@cypress/core-extension")
appData   = require("./util/app_data")

fs              = Promise.promisifyAll(fs)
profiles        = appData.path("browsers")
pathToExtension = extension.getPathToExtension()
pathToTheme     = extension.getPathToTheme()
instance        = null

kill = (unbind) ->
  ## cleanup our running browser
  ## instance
  return if not instance
  if unbind
    instance.removeAllListeners()
  instance.kill()
  instance = null

process.once "exit", kill

defaultArgs = [
  "--test-type"
  "--ignore-certificate-errors"
  "--load-extension=#{pathToExtension},#{pathToTheme}"
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
  args: defaultArgs

  close: kill

  ensureProfile: (name) ->
    p = path.join(profiles, name)

    fs.ensureDirAsync(p).return(p)

  getBrowsers: ->
    launcher.detect()

  launch: (name, url, options = {}) ->
    kill(true)

    _.defaults options,
      args: []
      onBrowserOpen: ->
      onBrowserClose: ->

    args = defaultArgs.concat(options.args)

    ## ensure we have a folder created
    ## for this browser profile
    @ensureProfile(name)
    .then (dir) ->

      ## this overrides any previous user-data-dir args
      ## by being the last one
      args.push("--user-data-dir=#{dir}")

      launcher()
      .call("launch", name, url, args)
      .then (i) ->
        instance = i

        instance.once "exit", ->
          options.onBrowserClose()

        ## give a little padding around
        ## the browser opening
        Promise.delay(1000)
        .then ->
          options.onBrowserOpen()

          return instance
}