const fs = require('fs-extra')
const path = require('path')

function dist (...args) {
  const paths = [__dirname, '..', 'dist'].concat(args)

  return path.join(...paths)
}

module.exports = {
  getPathToDist (...args) {
    return dist(...args)
  },

  getInjectionContents () {
    return fs.readFile(dist('injection.js'))
  },

  getPathToIndex () {
    return dist('index.html')
  },
}
