const path = require('path')

module.exports = {
  getPathToE2E () {
    return path.join(__dirname, '..', 'cypress', 'e2e')
  },
}
