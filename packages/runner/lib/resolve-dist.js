const fs = require('fs-extra')
const path = require('path')

function dist (...args) {
  const paths = [__dirname, '..', 'dist'].concat(args)

  return path.join(...paths)
}

function getContents (filename) {
  return fs.readFile(dist(filename))
}

module.exports = {
  getPathToDist (...args) {
    return dist(...args)
  },

  getInjectionContents () {
    return getContents('injection.js')
  },

  getMultidomainInjectionContents () {
    return getContents('injection_multidomain.js')
  },

  getPathToIndex () {
    return dist('index.html')
  },
}
