/* eslint-disable no-console */

const fse = require('fs-extra')
const path = require('path')
const globber = require('glob')
const Promise = require('bluebird')

const fs = Promise.promisifyAll(fse)
const glob = Promise.promisify(globber)

const pathToPackages = path.join(__dirname, '..', 'node_modules', '@packages')

function deleteOutputFolder () {
  console.log('deleting ', pathToPackages)

  return fs.remove(pathToPackages)
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
      const relativePathToDest = path.relative(path.dirname(destinationLink), dirname)

      console.log(destinationLink, '->', relativePathToDest)

      return fs.symlink(relativePathToDest, destinationLink, 'junction')
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
