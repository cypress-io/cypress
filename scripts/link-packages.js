/* eslint-disable no-console */

const fse = require('fs-extra')
const path = require('path')
const globber = require('glob')
const Promise = require('bluebird')
const _ = require('lodash')

const fs = Promise.promisifyAll(fse)
const glob = Promise.promisify(globber)

const pathToPackages = path.join('node_modules', '@packages')

function deleteOutputFolder () {
  const wildcard = `${pathToPackages}/*`

  console.log('deleting all', wildcard)

  return glob(wildcard)
  .map((filename) => {
    return fs.unlinkAsync(filename)
  })
  .catch(_.noop)
}

function makeLinks () {
  return fs.ensureDir(pathToPackages)
  .then(() => {
    return glob('./packages/*/package.json')
    .map((filename) => {
      return fs.readJsonAsync(filename)
      .then((json) => {
        return { filename, json }
      })
    })
    .map(({ filename }) => {
      const dirname = path.dirname(filename)
      const basename = path.basename(dirname)

      const destinationLink = path.join(pathToPackages, basename)
      // const registerPath = path.join(destinationFolder, 'register.js')
      // const fullMain = path.resolve(dirname, json.main)

      // debug('full name', fullMain)
      // const relativePathToMain = path.relative(destinationFolder, fullMain)

      // debug('relative path to main', relativePathToMain)
      const relativePathToDest = path.relative(path.dirname(destinationLink), dirname)

      console.log(destinationLink, '->', relativePathToDest)

      return fs.symlink(relativePathToDest, destinationLink)
    })
  })
}

function linkPackages () {
  return deleteOutputFolder()
  .then(makeLinks)
  .then(() => {
    console.log('✅  require("@packages/<name>") should work now!')
  })
}

module.exports = linkPackages

if (!module.parent) {
  linkPackages()
}
