path = require("path")

file = (name) ->
  "file://" + path.join(__dirname, "..", "dist", name)

module.exports = {
  getPathToIndex: ->
    file("index.html")

  getPathToAbout: ->
    file("about.html")

  getPathToDebug: ->
    file("debug.html")

}