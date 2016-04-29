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
instance        = null

kill = ->
  ## cleanup our running browser
  ## instance
  return if not instance
  instance.kill()
  instance = null

process.once "exit", kill

defaultArgs = [
  "--test-type"
  "--ignore-certificate-errors"
  "--load-and-launch-app=#{pathToExtension}"
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
  "--disable-renderer-throttling"
  "--disable-restore-session-state"
  "--disable-translate"
  "--disable-default-apps"
  "--disable-sync"
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