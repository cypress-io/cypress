path    = require("path")
Promise = require("bluebird")
util    = require("./util")

module.exports = {
  version: (p) ->
    util.parse(p, "KSVersion")

  path: ->
    util.find("com.google.Chrome.canary")

  get: (executable) ->
    @path()
    .then (p) =>
      Promise.props({
        path:    path.join(p, executable)
        version: @version(p)
      })
}