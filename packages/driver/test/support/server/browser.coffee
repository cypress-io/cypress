Promise = require("bluebird")
fs = Promise.promisifyAll(require("fs-extra"))
path = require("path")
launcher = require("@packages/launcher")

profileDir = path.join(__dirname, "../../../dist-test/browsers/chrome")
themeDir = path.join(__dirname, "theme")

args = [
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

  # Run Chrome with options to work inside Docker container
  "--no-sandbox"
  "--disable-gpu"

  "--load-extension=#{themeDir}"
  "--user-data-dir=#{profileDir}"
]

module.exports = {
  launch: (browser, url) ->
    fs.ensureDirAsync(profileDir)
    .then ->
      launcher()
    .then (launch) ->
      launch.launch(browser, url, args)
    .then (spawnedBrowser) ->
      {
        stop: ->
          new Promise (resolve) ->
            spawnedBrowser.once("exit", resolve)
            spawnedBrowser.kill()
      }
}
