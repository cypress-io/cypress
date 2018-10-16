fs      = require("./fs")
path    = require("path")
trash   = require("trash")
Promise = require("bluebird")

module.exports = {
  folder: (pathToFolder) ->
    fs.statAsync(pathToFolder)
    .then ->
      fs.readdirAsync(pathToFolder).map (item) ->
        trash([path.join(pathToFolder, item)])
    .catch ->
      return
}
