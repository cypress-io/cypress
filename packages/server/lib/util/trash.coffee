fs      = require("./fs")
path    = require("path")
trash   = require("trash")
Promise = require("bluebird")

module.exports = {
  folder: (pathToFolder) ->
    fs.statAsync(pathToFolder)
    .then ->
      Promise.map(fs.readdirAsync(pathToFolder), (item) ->
        return trash([path.join(pathToFolder, item)]))
    .catch {code: "ENOENT"}, ->
      return
}
