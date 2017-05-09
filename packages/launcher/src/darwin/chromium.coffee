path    = require("path")
Promise = require("bluebird")
util    = require("./util")

module.exports = {
  version: (p) ->
    util.parse(p, "CFBundleShortVersionString")

  path: ->
    util.find("org.chromium.Chromium")

  get: (executable) ->
    @path()
    .then (p) =>
      Promise.props({
        path:    path.join(p, executable)
        version: @version(p)
      })
}