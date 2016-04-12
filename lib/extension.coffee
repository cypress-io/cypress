path = require("path")

module.exports = {
  getPathToExtension: ->
    path.join(__dirname, "..", "dist")
}