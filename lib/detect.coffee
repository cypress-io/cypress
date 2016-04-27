_       = require("lodash")
os      = require("os")
Promise = require("bluebird")
darwin  = require("./darwin")

browsers = [
  {
    name: "chrome"
    re: /Google Chrome (\S+)/
    profile: true
    binary: "google-chrome"
    executable: "Contents/MacOS/Google Chrome"
  },{
    name: "chromium"
    re: /Chromium (\S+)/
    profile: true
    binary: "chromium"
    executable: "Contents/MacOS/Chromium"
  },{
    name: "canary"
    re: /Google Canary (\S+)/
    profile: true
    binary: "canary"
    executable: "Contents/MacOS/Google Canary"
  }
]

lookup = (platform, obj) ->
  switch platform

    when "darwin"
      if fn = darwin[obj.name]
        fn.get(obj.executable)
      else
        err = new Error("Browser not installed: #{obj.name}")
        err.notInstalled = true
        Promise.reject(err)

    when "linux"
      linux[obj.name].get()

module.exports = ->
  platform = os.platform()

  Promise
  .map browsers, (obj) ->
    lookup(platform, obj)
    .then (props) ->
      _.chain({})
      .extend(obj, props)
      .pick("name", "type", "version", "path")
      .value()
    .catch {notInstalled: true}, ->
      return false
  .then(_.compact)