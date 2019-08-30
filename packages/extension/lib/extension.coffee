fs         = require("fs")
path       = require("path")
Promise    = require("bluebird")
{ getCookieUrl } = require('./util')

fs = Promise.promisifyAll(fs)

module.exports = {
  getPathToExtension: (args...) ->
    args = [__dirname, "..", "dist"].concat(args)

    path.join.apply(path, args)

  getPathToTheme: ->
    path.join(__dirname, "..", "theme")

  getPathToRoot: ->
    path.join(__dirname, "..")

  setHostAndPath: (host, path) ->
    src = @getPathToExtension("background.js")

    fs.readFileAsync(src, "utf8")
    .then (str) ->
      str
      .replace("CHANGE_ME_HOST", host)
      .replace("CHANGE_ME_PATH", path)

  getCookieUrl

}
