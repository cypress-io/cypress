const path = require('path')
const Promise = require('bluebird')
const { getCookieUrl } = require('./util')
const fs = Promise.promisifyAll(require('fs'))

module.exports = {
  getPathToExtension (fileName, version = 'v2') {
    const args = [__dirname, '..', 'dist', version]

    return path.join.apply(path, fileName ? args.concat(fileName) : args)
  },

  getPathToV3Extension (...args) {
    return path.join(...[__dirname, '..', 'dist', 'v3', ...args])
  },

  getPathToTheme () {
    return path.join(__dirname, '..', 'theme')
  },

  getPathToRoot () {
    return path.join(__dirname, '..')
  },

  setHostAndPath (host, path, version = 'v2') {
    const src = this.getPathToExtension('background.js', version)

    return fs.readFileAsync(src, 'utf8')
    .then((str) => {
      return str
      .replace('CHANGE_ME_HOST', host)
      .replace('CHANGE_ME_PATH', path)
    })
  },

  getCookieUrl,

}
