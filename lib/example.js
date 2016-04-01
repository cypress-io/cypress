var path = require("path")

module.exports = {
  getPathToExample: function(){
    return path.join(__dirname, "..", "cypress", "integration", "example_spec.js")
  }
}