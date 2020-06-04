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
const path = require('path')
const Promise = require('bluebird')
const fs = require('./util/fs')

module.exports = {
  readFile (projectRoot, file, options = {}) {
    const filePath = path.resolve(projectRoot, file)
    const readFn = path.extname(filePath) === '.json' ?
      fs.readJsonAsync
      :
      fs.readFileAsync

    return readFn(filePath, options.encoding || 'utf8')
    .then((contents) => {
      return {
        contents,
        filePath,
      }
    })
    .catch((err) => {
      err.filePath = filePath
      throw err
    })
  },

  writeFile (projectRoot, file, contents, options = {}) {
    const filePath = path.resolve(projectRoot, file)
    const writeOptions = {
      encoding: options.encoding || 'utf8',
      flag: options.flag || 'w',
    }

    return fs.outputFile(filePath, contents, writeOptions)
    .then(() => {
      return {
        contents,
        filePath,
      }
    })
    .catch((err) => {
      err.filePath = filePath
      throw err
    })
  },
}
