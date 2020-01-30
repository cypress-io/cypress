const path = require('path')
const Promise = require('bluebird')
const { getCookieUrl } = require('./util')
const fs = Promise.promisifyAll(require('fs'))

module.exports = {
  getPathToExtension (...args) {
    args = [__dirname, '..', 'dist'].concat(args)

    return path.join.apply(path, args)
  },

  getPathToTheme () {
    return path.join(__dirname, '..', 'theme')
  },

  getPathToRoot () {
    return path.join(__dirname, '..')
  },

  setHostAndPath (host, path) {
    const src = this.getPathToExtension('background.js')

    return fs.readFileAsync(src, 'utf8')
    .then((str) => {
      return str
      .replace('CHANGE_ME_HOST', host)
      .replace('CHANGE_ME_PATH', path)
    })
  },

  getCookieUrl,

}
