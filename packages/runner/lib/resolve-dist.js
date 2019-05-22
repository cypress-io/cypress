const path = require('path')

function dist (...args) {
  const paths = [__dirname, '..', 'dist'].concat(args)
  return path.join(...paths)
}

module.exports = {
  getPathToDist (...args) {
    return dist(...args)
  },

  getPathToIndex () {
    return dist('index.html')
  },
}
