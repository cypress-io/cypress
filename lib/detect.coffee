_       = require("lodash")
os      = require("os")
Promise = require("bluebird")
darwin  = require("./darwin")

browsers = [
  {
    name: "chrome"
    re: /Google Chrome (\S+)/
    type: "chrome"
    profile: true
    binary: "google-chrome"
    executable: "Google Chrome"
  },{
    name: "chromium"
    re: /Chromium (\S+)/
    type: "chrome"
    profile: true
    binary: "chromium"
    executable: "Chromium"
  }
]

lookup = (platform, obj) ->
  switch platform
    when "darwin"
      darwin[obj.type].get(obj.executable)
    when "linux"
      linux[obj.type].get()

module.exports = ->
  platform = os.platform()

  Promise.filter browsers, (obj) ->
    lookup(platform, obj)
    .then (props) ->
      console.log props
      _.chain({})
      .extend(obj, props)
      .pick("name", "type", "version", "path")
      .value()
    .catch {notInstalled: true}, ->
      return false
