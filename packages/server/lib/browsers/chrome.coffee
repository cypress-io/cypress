_         = require("lodash")
os        = require("os")
fs        = require("fs-extra")
Promise   = require("bluebird")
extension = require("@packages/extension")
debug     = require("debug")("cypress:server:browsers")
plugins   = require("../plugins")
appData   = require("../util/app_data")
utils     = require("./utils")

fs = Promise.promisifyAll(fs)

LOAD_EXTENSION = "--load-extension="

pathToExtension = extension.getPathToExtension()
pathToTheme     = extension.getPathToTheme()

defaultArgs = [
  "--test-type" ## Type of the current test harness ("browser" or "ui") QUESTION: Are we using this right?
  "--ignore-certificate-errors"
  "--start-maximized"
  "--silent-debugger-extension-api" ## Does not show an infobar when an extension attaches to a page using chrome.debugger page
  "--no-default-browser-check"
  "--no-first-run"
  "--noerrdialogs" ## Suppresses all error dialogs
  "--enable-fixed-layout" ## QUESTION: Does this do anything? Can't find info on what it does
  "--disable-popup-blocking"
  "--disable-password-generation"
  "--disable-save-password-bubble"
  "--disable-single-click-autofill"
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

  ## the following come from chromedriver
  ## https://code.google.com/p/chromium/codesearch#chromium/src/chrome/test/chromedriver/chrome_launcher.cc&sq=package:chromium&l=70
  "--metrics-recording-only" ## Enables the recording of metrics reports but disables reporting
  "--disable-prompt-on-repost" ## Disables prompt when user re-submits POST form
  "--disable-hang-monitor" ## Suppresses hang monitor dialogs in renderer processes
  "--disable-sync"
  ## this flag is causing throttling of XHR callbacks for
  ## as much as 30 seconds. If you VNC in and open dev tools or
  ## click on a button, it'll "instantly" work. with this
  ## option enabled, it will time out some of our tests in circle
  # "--disable-background-networking"
  "--disable-web-resources"
  "--safebrowsing-disable-auto-update"
  "--safebrowsing-disable-download-protection"
  "--disable-client-side-phishing-detection"
  "--disable-component-update"
  "--disable-default-apps"
]

_normalizeArgExtensions = (dest, args) ->
  loadExtension = _.find args, (arg) ->
    arg.includes(LOAD_EXTENSION)

  if loadExtension
    args = _.without(args, loadExtension)

    ## form into array, enabling users to pass multiple extensions
    userExtensions = loadExtension.replace(LOAD_EXTENSION, "").split(",")

  extensions = [].concat(userExtensions, dest, pathToTheme)

  args.push(LOAD_EXTENSION + _.compact(extensions).join(","))

  args

module.exports = {
  _normalizeArgExtensions

  _getArgs: (options = {}) ->
    args = [].concat(defaultArgs)

    if os.platform() is "linux"
      args.push("--disable-gpu")
      args.push("--no-sandbox")

    if ua = options.userAgent
      args.push("--user-agent=#{ua}")

    if ps = options.proxyServer
      args.push("--proxy-server=#{ps}")

    if options.chromeWebSecurity is false
      args.push("--disable-web-security")
      args.push("--allow-running-insecure-content")

    args

  open: (browserName, url, options = {}, automation) ->
    args = @_getArgs(options)

    Promise
    .try ->
      ## bail if we're not registered to this event
      return if not plugins.has("before:browser:launch")

      plugins.execute("before:browser:launch", options.browser, args)
      .then (newArgs) ->
        debug("got user args for 'before:browser:launch'", newArgs)

        ## reset args if we got 'em
        if newArgs
          args = newArgs
    .then =>
      Promise.all([
        ## ensure that we have a chrome profile dir
        utils.ensureProfile(browserName)

        utils.writeExtension(options.proxyUrl, options.socketIoRoute)
      ])
    .spread (dir, dest) ->
      ## normalize the --load-extensions argument by
      ## massaging what the user passed into our own
      args = _normalizeArgExtensions(dest, args)

      ## this overrides any previous user-data-dir args
      ## by being the last one
      args.push("--user-data-dir=#{dir}")

      debug("launch in chrome: %s, %s", url, args)

      utils.launch(browserName, url, args)
}
