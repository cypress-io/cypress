fs      = require("fs")
path    = require("path")
Promise = require("bluebird")

fs = Promise.promisifyAll(fs)

hostRe = /HOST = (".*")/g
pathRe = /PATH = (".*")/g

replacer = (val) ->
  return (line, capture) ->
    ## swap out the capture group
    ## in the line with val
    line.replace(capture, '"' + val + '"')

module.exports = {
  getPathToExtension: (args...) ->
    args = [__dirname, "..", "dist"].concat(args)

    path.join.apply(path, args)

  setHostAndPath: (host, path) ->
    background = @getPathToExtension("background.js")

    fs.readFileAsync(background, "utf8")
    .then (str) ->
      str
      .replace hostRe, replacer(host)
      .replace pathRe, replacer(path)

    .then (str) ->
      fs.writeFileAsync(background, str)
}