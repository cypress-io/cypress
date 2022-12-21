/* eslint-disable no-console */
const _ = require('lodash')
const os = require('os')
const path = require('path')
const paths = require('./paths')
const log = require('debug')('cypress:electron')
const fs = require('fs-extra')
const crypto = require('crypto')
const { flipFuses, FuseVersion, FuseV1Options } = require('@electron/fuses')
const pkg = require('@packages/root')

let electronVersion

// ensure we have an electronVersion set in package.json
if (!(electronVersion = pkg.devDependencies.electron)) {
  throw new Error('Missing \'electron\' devDependency in root package.json')
}

module.exports = {
  getElectronVersion () {
    return electronVersion
  },

  // returns icons package so that the caller code can find
  // paths to the icons without hard-coding them
  icons () {
    return require('@packages/icons')
  },

  checkCurrentVersion () {
    const pathToVersion = paths.getPathToVersion()

    // read in the version file
    return fs.readFile(pathToVersion, 'utf8')
    .then((str) => {
      const version = str.replace('v', '')

      // and if it doesn't match the electron version
      // throw an error
      if (version !== electronVersion) {
        throw new Error(`Currently installed version: '${version}' does not match electronVersion: '${electronVersion}`)
      }
    })
  },

  getFileHash (filePath) {
    return fs.readFile(filePath).then((buf) => {
      const hashSum = crypto.createHash('sha1')

      hashSum.update(buf)
      const hash = hashSum.digest('hex')

      return hash
    })
  },

  checkIconVersion () {
    const mainIconsPath = this.icons().getPathToIcon('cypress.icns')
    const cachedIconsPath = path.join(__dirname, '../dist/Cypress/Cypress.app/Contents/Resources/electron.icns')

    return Promise.all([this.getFileHash(mainIconsPath), this.getFileHash(cachedIconsPath)])
    .then(([mainHash, cachedHash]) => {
      if (mainHash !== cachedHash) {
        throw new Error('Icon mismatch')
      }
    })
  },

  checkExecExistence () {
    return fs.stat(paths.getPathToExec())
  },

  move (src, dest) {
    // src  is ./tmp/Cypress-darwin-x64
    // dest is ./dist/Cypress
    return fs.move(src, dest, { overwrite: true })
    .then(() => {
      // remove the tmp folder now
      return fs.remove(path.dirname(src))
    })
  },

  removeEmptyApp () {
    // nuke the temporary blank /app
    return fs.remove(paths.getPathToResources('app'))
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
    const icons = require('@packages/icons')

    const iconPath = icons.getPathToIcon('cypress')

    log('package icon', iconPath)

    const platform = os.platform()
    const arch = os.arch()

    _.defaults(options, {
      dist: paths.getPathToDist(),
      dir: 'app',
      out: 'tmp',
      name: 'Cypress',
      platform,
      arch,
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
    })
    .then(() => {
      return !['1', 'true'].includes(process.env.DISABLE_SNAPSHOT_REQUIRE) ? flipFuses(
        paths.getPathToExec(),
        {
          version: FuseVersion.V1,
          resetAdHocDarwinSignature: platform === 'darwin' && arch === 'arm64',
          [FuseV1Options.LoadBrowserProcessSpecificV8Snapshot]: true,
        },
      ) : Promise.resolve()
    }).catch((err) => {
      console.log(err.stack)

      return process.exit(1)
    })
  },

  ensure () {
    return Promise.all([
      // check the version of electron and re-build if updated
      this.checkCurrentVersion(),
      // check if the dist folder exist and re-build if not
      this.checkExecExistence(),
      // Compare the icon in dist with the one in the icons
      // package. If different, force the re-build.
      this.checkIconVersion(),
    ])

    // if all is good, then return without packaging a new electron app
  },

  check () {
    return this.ensure()
    .catch(() => {
      this.packageAndExit()
    })
  },
}
