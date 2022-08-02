const Promise = require('bluebird')
const debug = require('debug')('cypress:cli')
const path = require('path')

const util = require('../util')
const state = require('../tasks/state')
const { throwFormErrorText, errors } = require('../errors')

const getVersions = () => {
  return Promise.try(() => {
    if (util.getEnv('CYPRESS_RUN_BINARY')) {
      let envBinaryPath = path.resolve(util.getEnv('CYPRESS_RUN_BINARY'))

      return state.parseRealPlatformBinaryFolderAsync(envBinaryPath)
      .then((envBinaryDir) => {
        if (!envBinaryDir) {
          return throwFormErrorText(errors.CYPRESS_RUN_BINARY.notValid(envBinaryPath))()
        }

        debug('CYPRESS_RUN_BINARY has binaryDir:', envBinaryDir)

        return envBinaryDir
      })
      .catch({ code: 'ENOENT' }, (err) => {
        return throwFormErrorText(errors.CYPRESS_RUN_BINARY.notValid(envBinaryPath))(err.message)
      })
    }

    return state.getBinaryDir()
  })
  .then(state.getBinaryPkgAsync)
  .then((pkg) => {
    const versions = {
      binary: state.getBinaryPkgVersion(pkg),
      electronVersion: state.getBinaryElectronVersion(pkg),
      electronNodeVersion: state.getBinaryElectronNodeVersion(pkg),
    }

    debug('binary versions %o', versions)

    return versions
  })
  .then((binaryVersions) => {
    const buildInfo = util.pkgBuildInfo()

    let packageVersion = util.pkgVersion()

    if (!buildInfo) packageVersion += ' (development)'
    else if (!buildInfo.stable) packageVersion += ' (pre-release)'

    const versions = {
      package: packageVersion,
      binary: binaryVersions.binary || 'not installed',
      electronVersion: binaryVersions.electronVersion || 'not found',
      electronNodeVersion: binaryVersions.electronNodeVersion || 'not found',
    }

    debug('combined versions %o', versions)

    return versions
  })
}

module.exports = {
  getVersions,
}
