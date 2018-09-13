path    = require("path")
trash   = require("trash")
Promise = require("bluebird")

module.exports = {
  folder: (pathToFolder) ->
    Promise.resolve(trash([path.join(pathToFolder, "**"),"!#{pathToFolder}"], {glob: true}))
}
