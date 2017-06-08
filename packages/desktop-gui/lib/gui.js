let path = require("path")

function file (name) {
  return `file://${path.join(__dirname, "..", "dist", name)}`
}

module.exports = {
  getPathToIndex () {
    return file("index.html")
    // return file("index.html?projectPath=/Users/chrisbreiding/Dev/cypress/_playground")
  },

  getPathToUpdates () {
    return file("updates.html")
  },
}
