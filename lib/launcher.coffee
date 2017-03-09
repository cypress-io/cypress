_             = require("lodash")
fs            = require("fs-extra")
path          = require("path")
Promise       = require("bluebird")
electron      = require("electron")
contextMenu   = require("electron-context-menu")
launcher      = require("@cypress/core-launcher")
extension     = require("@cypress/core-extension")
appData       = require("./util/app_data")
savedState    = require("./saved_state")
electronUtils = require("./electron/utils")
automation    = require("./electron/handlers/automation")
Renderer      = require("./electron/handlers/renderer")

fs              = Promise.promisifyAll(fs)
profiles        = appData.path("browsers")
pathToExtension = extension.getPathToExtension()
pathToTheme     = extension.getPathToTheme()
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
  "--allow-insecure-localhost"
  "--reduce-security-for-testing"

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

    currentBrowser = name

    switch name
      when "electron"
        @_launchElectron(url, options)
      else
        @_launchBrowser(name, url, options)

  _launchElectron: (url, options) ->
    electronUtils.setProxy(options.proxyServer)
    .then ->
      savedState.get()
    .then (state) ->
      Renderer.create({
        url: url
        width: state.browserWidth or 800
        height: state.browserHeight or 600
        minWidth: 100
        minHeight: 100
        x: state.browserX
        y: state.browserY
        show: true
        chromeWebSecurity: options.chromeWebSecurity
        type: "PROJECT"
        onClose: options.onBrowserClose
      })
      .then (win) ->
        Renderer.trackState(win, state, {
          width: "browserWidth"
          height: "browserHeight"
          x: "browserX"
          y: "browserY"
          devTools: "isBrowserDevToolsOpen"
        })

        ## adds context menu with copy, paste, inspect element, etc
        contextMenu({
          showInspectElement: true
          window: win
        })

        ## open any links externally, not in new electron browser
        win.webContents.on "new-window", (e, url) ->
          e.preventDefault()
          electron.shell.openExternal(url)

        ## TODO: same as below concerning waiting for socket connection
        Promise.delay(1000)
        .then ->
          options.onBrowserOpen()

          return instance = {
            kill: ->
              if not win.isDestroyed()
                win.close()
            ## renderer takes care of removing listeners
            removeAllListeners: ->
          }

  _launchBrowser: (name, url, options) ->
    args = defaultArgs.concat(options.args)

    ## ensure we have a folder created
    ## for this browser profile
    @ensureProfile(name)
    .then (dir) ->

      ## this overrides any previous user-data-dir args
      ## by being the last one
      args.push("--user-data-dir=#{dir}")

      if ps = options.proxyServer
        args.push("--proxy-server=#{ps}")

      if options.chromeWebSecurity is false
        args.push("--disable-web-security")
        args.push("--allow-running-insecure-content")

      launcher()
      .call("launch", name, url, args)
      .then (i) ->
        instance = i

        instance.once "exit", ->
          options.onBrowserClose()

        ## TODO: instead of waiting an arbitrary
        ## amount of time here we could instead
        ## wait for the socket.io connect event
        ## which would mean that our browser is
        ## completely rendered and open. that would
        ## mean moving this code out of here and
        ## into the project itself
        ## (just like headless code)
        ## ----------------------------
        ## give a little padding around
        ## the browser opening
        Promise.delay(1000)
        .then ->
          options.onBrowserOpen()

          return instance

  onAutomationRequest: (args...) ->
    if currentBrowser is "electron"
      automation.perform(args...)

}
