/* eslint-disable
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const r = require('@cypress/request')
const rp = require('@cypress/request-promise')
const Promise = require('bluebird')
const fs = require('./util/fs')

module.exports = {
  send (pathToFile, url) {
    return fs
    .readFileAsync(pathToFile)
    .then((buf) => {
      return rp({
        url,
        method: 'PUT',
        body: buf,
      })
    })
  },
}
