const path = require('path')

module.exports = {
  getPathToExample () {
    return path.join(__dirname, '..', 'cypress', 'integration', 'example_spec.js')
  },
}
