// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const fs = require('./fs')
const path = require('path')
const trash = require('trash')
const Promise = require('bluebird')

module.exports = {
  folder (pathToFolder) {
    return fs.statAsync(pathToFolder)
    .then(() => {
      return Promise.map(fs.readdirAsync(pathToFolder), (item) => {
        return trash([path.join(pathToFolder, item)])
      })
    }).catch({ code: 'ENOENT' }, () => {
    })
  },
}
