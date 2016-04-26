_       = require("lodash")
os      = require("os")
Promise = require("bluebird")
darwin  = require("./darwin")

browsers = {
  "google-chrome": {
    name: "chrome",
    re: /Google Chrome (\S+)/,
    type: "chrome",
    profile: true,
  }

  "chromium": {
    name: "chromium",
    re: /Chromium (\S+)/,
    type: "chrome",
    profile: true,
  }
}

lookup = (platform, browser, obj) ->
  switch platform
    when "darwin"
      darwin[browser].get()
    when "linux"
      linux[browser].get()

module.exports = ->
  platform = os.platform()

  Promise.filter browsers, (obj, browser) ->
    lookup(platform, browser, obj)
    .then (props) ->
      _.chain({})
      .extend(browser, props)
      .pick("name", "type", "version", "path")
      .value()
    .catch {notInstalled: true}, ->
      return false