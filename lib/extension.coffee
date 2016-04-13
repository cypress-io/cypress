fs      = require("fs")
path    = require("path")
Promise = require("bluebird")

fs = Promise.promisifyAll(fs)

module.exports = {
  getPathToExtension: (args...) ->
    args = [__dirname, "..", "dist"].concat(args)

    path.join.apply(path, args)

  setHostAndPath: (host, path) ->
    src  = @getPathToExtension("background_src.js")
    dest = @getPathToExtension("background.js")

    fs.readFileAsync(src, "utf8")
    .then (str) ->
      str
      .replace("CHANGE_ME_HOST", host)
      .replace("CHANGE_ME_PATH", path)
    .then (str) ->
      fs.writeFileAsync(dest, str)
}