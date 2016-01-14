path = require("path")

module.exports = {
  getPathToHtml: ->
    "file://" + path.join(__dirname, "..", "dest", "index.html")
}