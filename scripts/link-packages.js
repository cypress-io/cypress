/* eslint-disable no-console */

const execa = require('execa')
const fse = require('fs-extra')
const path = require('path')
const globber = require('glob')
const Promise = require('bluebird')

const fs = Promise.promisifyAll(fse)
const glob = Promise.promisify(globber)

const pathToPackages = path.join(__dirname, '..', 'node_modules', '@packages')

function symlink(target, from) {
  if (process.platform === 'win32') {
    // https://github.com/cypress-io/cypress/issues/4777
    target = path.resolve(target.slice(6))
    return execa('CMD', ['/C', 'MKLINK', '/D', '/J', from, target])
    .then((res) => {
      if (!res.stdout.includes('Junction created')) {
        throw new Error(`Failed creating symlink from ${from} to ${target}: stdout: ${res.stdout} stderr: ${res.stderr}`)
      }
    })
  }

  return fs.symlink(target, from)
}

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
      // const registerPath = path.join(destinationFolder, 'register.js')
      // const fullMain = path.resolve(dirname, json.main)

      // debug('full name', fullMain)
      // const relativePathToMain = path.relative(destinationFolder, fullMain)

      // debug('relative path to main', relativePathToMain)
      const relativePathToDest = path.relative(path.dirname(destinationLink), dirname)

      console.log(destinationLink, '->', relativePathToDest)

      return symlink(relativePathToDest, destinationLink)
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
