const path = require('path')

module.exports = {
  getPathToDist (...args) {
    return path.join(...[__dirname, '..', 'dist', ...args])
  },
}
