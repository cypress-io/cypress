fs      = require("fs")
path    = require("path")
trash   = require("trash")
Promise = require("bluebird")

module.exports = {
  folder: (pathToFolder) ->
    Promise.all(fs.readdirSync(pathToFolder).map (item) ->
      trash([path.join(pathToFolder, item)])
    )
}
