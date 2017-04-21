_       = require("lodash")
os      = require("os")
Promise = require("bluebird")
linux   = require("./linux")
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
    binary: "chromium-browser"
    executable: "Contents/MacOS/Chromium"
  },{
    name: "canary"
    re: /Google Chrome Canary (\S+)/
    profile: true
    binary: "google-chrome-canary"
    executable: "Contents/MacOS/Google Chrome Canary"
  }
]

setMajorVersion = (obj) ->
  obj.majorVersion = obj.version.split(".")[0]
  obj

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
      linux.get(obj.binary, obj.re)

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
    .then(setMajorVersion)
    .catch {notInstalled: true}, ->
      return false
  .then(_.compact)