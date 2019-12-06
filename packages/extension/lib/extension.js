/* eslint-disable
    prefer-spread,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let fs = require('fs')
const path = require('path')
const Promise = require('bluebird')
const background = require('../app/background')

fs = Promise.promisifyAll(fs)

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

  getCookieUrl: background.getUrl,

  connect: background.connect,

  app: background,
}
