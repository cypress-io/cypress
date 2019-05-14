/* eslint-disable no-console */

const fse = require('fs-extra')
const path = require('path')
const globber = require('glob')
const Promise = require('bluebird')
const la = require('lazy-ass')
const is = require('check-more-types')
const debug = require('debug')('cypress:link')
const _ = require('lodash')

const isRelative = (s) => {
  return !path.isAbsolute(s)
}

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

function proxyModule (name, pathToMain, pathToBrowser) {
  // la(is.unemptyString(name), 'missing name')
  // la(is.unemptyString(pathToMain), 'missing path to main', pathToMain)
  // la(isRelative(pathToMain), 'path to main should be relative', pathToMain)

  const pkg = {
    name,
    version: '0.0.0',
    description: `fake proxy module ${name}`,
    main: pathToMain,
  }

  if (pathToBrowser) {
    la(isRelative(pathToBrowser),
      'path to browser module should be relative', pathToBrowser)
    pkg.browser = pathToBrowser
  }

  return pkg
}

function proxyRegister (name) {
  return `module.exports = require('../../../packages/${name}/register')`
}

function needsRegister (name) {
  return name === '@packages/coffee' || name === '@packages/ts'
}

function makeProxies () {
  return glob('./packages/*/package.json')
  .map((filename) => {
    return fs.readJsonAsync(filename)
    .then((json) => {
      return { filename, json }
    })
  }
  )
  .map(({ filename, json }) => {
    // if (!json.main) {
    //   throw new Error(`Package ${json.name} is missing main`)
    // }

    const dirname = path.dirname(filename)
    const basename = path.basename(dirname)

    const destinationLink = path.join(pathToPackages, basename)
    // const registerPath = path.join(destinationFolder, 'register.js')
    // const fullMain = path.resolve(dirname, json.main)

    // debug('full name', fullMain)
    // const relativePathToMain = path.relative(destinationFolder, fullMain)

    // debug('relative path to main', relativePathToMain)
    console.log(`${destinationLink} -> ${dirname}`)
    const relativePathToDest = path.relative(path.dirname(destinationLink), dirname)

    console.log(dirname, '->', relativePathToDest)

    // const proxy = proxyModule(json.name, relativePathToMain, relativePathToBrowser)

    fs.mkdirp(path.dirname(destinationLink))

    return fs.symlink(relativePathToDest, path.join(pathToPackages, basename))
    // return fs.outputJsonAsync(destPackageFilename, proxy)
    .then(() => {
      // if (needsRegister(json.name)) {
      // console.log('adding register file', registerPath)

      // return fs.outputFileAsync(registerPath, proxyRegister(bareName), 'utf8')
      // }
    })
  })
}

function linkPackages () {
  return deleteOutputFolder()
  .then(makeProxies)
  .then(() => {
    console.log('✅  require("@packages/<name>") should work now!')
  })
}

module.exports = linkPackages

if (!module.parent) {
  linkPackages()
}
