/* eslint-disable no-console */
const _ = require('lodash')
const os = require('os')
const path = require('path')
const systeminformation = require('systeminformation')
const execa = require('execa')

const paths = require('./paths')
const debug = require('debug')('cypress:electron')
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

  checkCurrentVersion (pathToVersion) {
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
    // TODO: this seems wrong, it's hard coding the check only for OSX and not windows or linux (!?)
    const mainIconsPath = this.icons().getPathToIcon('cypress.icns')
    const cachedIconsPath = path.join(__dirname, '../dist/Cypress/Cypress.app/Contents/Resources/electron.icns')

    return Promise.all([this.getFileHash(mainIconsPath), this.getFileHash(cachedIconsPath)])
    .then(([mainHash, cachedHash]) => {
      if (mainHash !== cachedHash) {
        throw new Error('Icon mismatch')
      }
    })
  },

  checkExecExistence (pathToExec) {
    return fs.stat(pathToExec)
  },

  async checkBinaryArchCpuArch (pathToExec, platform, arch) {
    if (platform === 'darwin' && arch === 'x64') {
      return Promise.all([
        // get the current arch of the binary
        execa('lipo', ['-archs', pathToExec])
        .then(({ stdout }) => {
          return stdout
        }),

        // get the real arch of the system
        this.getRealArch(platform, arch),
      ])
      .then(([binaryArch, cpuArch]) => {
        debug('archs detected %o', { binaryArch, cpuArch })

        if (binaryArch !== cpuArch) {
          throw new Error(`built binary arch: '${binaryArch}' does not match system CPU arch: '${cpuArch}', binary needs rebuilding`)
        }
      })
    }
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

  async getRealArch (platform, arch) {
    if (platform === 'darwin' && arch === 'x64') {
      // see this comment for explanation of x64 -> arm64 translation
      // https://github.com/cypress-io/cypress/pull/25014/files#diff-85c4db7620ed2731baf5669a9c9993e61e620693a008199ca7c584e621b6a1fdR11
      return systeminformation.cpu()
      .then(({ manufacturer }) => {
        // if the cpu is apple then return arm64 as the arch
        return manufacturer === 'Apple' ? 'arm64' : arch
      })
    }

    return arch
  },

  package (options = {}) {
    /**
     * NOTE: electron-packager as of v16.0.0 does not play well with
     * our mksnapshot. Requiring the package in this way, dynamically, will
     * make it undiscoverable by mksnapshot, which is OK since electron-packager
     * is a build dependency.
     */
    const e = 'electron'
    const p = 'packager'
    const pkgr = require(`${e}-${p}`)
    const icons = require('@packages/icons')

    const iconPath = icons.getPathToIcon('cypress')

    debug('package icon', iconPath)

    const platform = os.platform()
    const arch = os.arch()

    return this.getRealArch(platform, arch)
    .then((arch) => {
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

      debug('packager options %j', options)

      return pkgr(options)
    })
    .then((appPaths) => {
      return appPaths[0]
    })
    // Promise.resolve("tmp\\Cypress-win32-x64")
    .then((appPath) => {
      const { dist } = options

      // and now move the tmp into dist
      debug('moving created file %o', { from: appPath, to: dist })

      return this.move(appPath, dist)
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
    const arch = os.arch()
    const platform = os.platform()
    const pathToExec = paths.getPathToExec()
    const pathToVersion = paths.getPathToVersion()

    return Promise.all([
      // check the version of electron and re-build if updated
      this.checkCurrentVersion(pathToVersion),
      // check if the dist folder exist and re-build if not
      this.checkExecExistence(pathToExec),
      // Compare the icon in dist with the one in the icons
      // package. If different, force the re-build.
      this.checkIconVersion(),
    ])
    .then(() => {
      // check that the arch of the built binary matches our CPU
      return this.checkBinaryArchCpuArch(pathToExec, platform, arch)
    })

    // if all is good, then return without packaging a new electron app
  },

  check () {
    return this.ensure()
    .catch((err) => {
      this.packageAndExit()
    })
  },
}
