/* eslint-disable
    no-console,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const fs = require('fs-extra')
const Promise = require('bluebird')

//# warn users if somehow synchronous file methods are invoked
//# these methods due to "too many files" errors are a huge pain
const warnOnSyncFileSystem = function () {
  console.error('WARNING: fs sync methods can fail due to EMFILE errors')
  console.error('Cypress only works reliably when ALL fs calls are async')

  return console.error('You should modify these sync calls to be async')
}

const topLines = (from, n, text) => {
  return text.split('\n').slice(from, n).join('\n')
}

// just hide this function itself
// stripping top few lines of the stack
const getStack = function () {
  const err = new Error()

  return topLines(3, 10, err.stack)
}

const addSyncFileSystemWarnings = function (fs) {
  const oldExistsSync = fs.existsSync

  fs.existsSync = function (filename) {
    warnOnSyncFileSystem()
    console.error(getStack())

    return oldExistsSync(filename)
  }
}

addSyncFileSystemWarnings(fs)

const promisifiedFs = Promise.promisifyAll(fs)

module.exports = promisifiedFs
