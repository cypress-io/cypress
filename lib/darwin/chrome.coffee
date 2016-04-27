Promise = require("bluebird")
util    = require("./util")

currentPath = null

module.exports = {
  reset: ->
    currentPath = null

  version: (p) ->
    util.parse(p, "KSVersion")

  path: ->
    if currentPath
      return Promise.resolve(currentPath)

    util.find("com.google.Chrome")
    .then (p) ->
      currentPath = p

  executable: (str, executable) ->
    path.join(str, "Contents", "MacOS", executable)

  get: (executable) ->
    @path()
    .then (p) =>
      Promise.props({
        path:    @executable(p, executable)
        version: @version(p)
      })
}