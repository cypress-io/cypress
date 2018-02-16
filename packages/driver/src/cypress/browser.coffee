_ = require("lodash")
$utils = require("./utils")

browsers = {
  electron: "chrome"
  chrome: "chrome"
  canary: "chrome"
  chromium: "chrome"
  firefoxDeveloperEdition: "firefox"
  firefoxNightly: "firefox"
}

isBrowser = (method, config, normalize, browserName = "") ->
  if not _.isString(browserName)
    $utils.throwErrByPath("browser.invalid_arg", {
      args: { method, browserName: $utils.stringify(browserName) }
    })

  browserName = browserName.toLowerCase()
  currentBrowser = config.browser.name.toLowerCase()
  if normalize
    currentBrowser = browsers[currentBrowser]

  return browserName is currentBrowser

module.exports = (config) ->
  {
    browser: config.browser
    isBrowser: _.partial(isBrowser, "isBrowser", config, false)
    isBrowserType: _.partial(isBrowser, "isBrowserType", config, true)
  }
