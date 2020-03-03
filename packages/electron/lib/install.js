/* eslint-disable no-console */
const _ = require('lodash')
const os = require('os')
const path = require('path')
const Promise = require('bluebird')
const pkg = require('../package.json')
const paths = require('./paths')
const log = require('debug')('cypress:electron')
let fs = require('fs-extra')

fs = Promise.promisifyAll(fs)

let electronVersion

// ensure we have an electronVersion set in package.json
if (!(electronVersion = pkg.devDependencies.electron)) {
  throw new Error('Missing \'electron\' devDependency in ./package.json')
}

module.exports = {
  getElectronVersion () {
    return electronVersion
  },

  // returns icons package so that the caller code can find
  // paths to the icons without hard-coding them
  icons () {
    return require('@cypress/icons')
  },

  checkCurrentVersion () {
    const pathToVersion = paths.getPathToVersion()

    // read in the version file
    return fs.readFileAsync(pathToVersion, 'utf8')
    .then((str) => {
      const version = str.replace('v', '')

      // and if it doesn't match the electron version
      // throw an error
      if (version !== electronVersion) {
        throw new Error(`Currently installed version: '${version}' does not match electronVersion: '${electronVersion}`)
      } else {
        return process.exit()
      }
    })
  },

  checkExecExistence () {
    return fs.statAsync(paths.getPathToExec())
  },

  move (src, dest) {
    // src  is ./tmp/Cypress-darwin-x64
    // dest is ./dist/Cypress
    return fs.moveAsync(src, dest, { overwrite: true })
    .then(() => {
      // remove the tmp folder now
      return fs.removeAsync(path.dirname(src))
    })
  },

  removeEmptyApp () {
    // nuke the temporary blank /app
    return fs.removeAsync(paths.getPathToResources('app'))
  },

  packageAndExit () {
    return this.package()
    .then(() => {
      return this.removeEmptyApp()
    }).then(() => {
      return process.exit()
    })
  },

  package (options = {}) {
    const pkgr = require('electron-packager')
    const icons = require('@cypress/icons')

    const iconPath = icons.getPathToIcon('cypress')

    log('package icon', iconPath)

    _.defaults(options, {
      dist: paths.getPathToDist(),
      dir: 'app',
      out: 'tmp',
      name: 'Cypress',
      platform: os.platform(),
      arch: os.arch(),
      asar: false,
      prune: true,
      overwrite: true,
      electronVersion,
      icon: iconPath,
    })

    log('packager options %j', options)

    return pkgr(options)
    .then((appPaths) => {
      return appPaths[0]
    })
    // Promise.resolve("tmp\\Cypress-win32-x64")
    .then((appPath) => {
      // and now move the tmp into dist
      console.log('moving created file from', appPath)
      console.log('to', options.dist)

      return this.move(appPath, options.dist)
    }).catch((err) => {
      console.log(err.stack)

      return process.exit(1)
    })
  },

  ensure () {
    return Promise.join(
      this.checkCurrentVersion(),
      this.checkExecExistence(),
    )
  },

  check () {
    return this.ensure()
    .bind(this)
    .catch(this.packageAndExit)
  },
}
