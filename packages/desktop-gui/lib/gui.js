var path = require("path")

function file (name) {
  return "file://" + path.join(__dirname, "..", "dist", name)
}

module.exports = {
  getPathToIndex: function () {
    return file("index.html")
  },

  getPathToUpdates: function () {
    return file("updates.html")
  },
}
