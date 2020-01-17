_ = require("lodash")
$utils = require("./utils")

browserFamilyMap = {
  chrome: "chrome"
  canary: "chrome"
  chromium: "chrome"
  electron: "chrome"

  firefox: "firefox"
  firefoxDeveloperEdition: "firefox"
  firefoxNightly: "firefox"

  ie: 'ie'
}

isBrowser = (config, browserName='') ->
  if not _.isString(browserName)
    $utils.throwErrByPath("browser.invalid_arg", {
      args: { method: 'isBrowser', browserName: $utils.stringify(browserName) }
    })

  browserName = browserName.toLowerCase()
  currentBrowser = config.browser.name.toLowerCase()
  ## use browser family if we have it, otherwise use browser name
  currentBrowser = browserFamilyMap[currentBrowser] || currentBrowser


  return browserName is currentBrowser

module.exports = (config) ->
  {
    browser: config.browser
    isBrowser: _.partial(isBrowser, config)
  }
