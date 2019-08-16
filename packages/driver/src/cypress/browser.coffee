_ = require("lodash")
$utils = require("./utils")

browsers = {
  chrome: "chrome"
  canary: "chrome"
  chromium: "chrome"
  electron: "chrome"

  firefox: "firefox"
  firefoxDeveloperEdition: "firefox"
  firefoxNightly: "firefox"

  ie: 'ie'
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
