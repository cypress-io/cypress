import Bluebird from 'bluebird'
import Debug from 'debug'
import path from 'path'
import util from '../util'
import state from '../tasks/state'
import { throwFormErrorText, errors } from '../errors'

const debug = Debug('cypress:cli')

const getVersions = (): any => {
  return Bluebird.try(() => {
    if (util.getEnv('CYPRESS_RUN_BINARY')) {
      let envBinaryPath = path.resolve(util.getEnv('CYPRESS_RUN_BINARY') as string)

      return state.parseRealPlatformBinaryFolderAsync(envBinaryPath)
      .then((envBinaryDir: any) => {
        if (!envBinaryDir) {
          return throwFormErrorText(errors.CYPRESS_RUN_BINARY.notValid(envBinaryPath))()
        }

        debug('CYPRESS_RUN_BINARY has binaryDir:', envBinaryDir)

        return envBinaryDir
      })
      .catch({ code: 'ENOENT' }, (err: any) => {
        return throwFormErrorText(errors.CYPRESS_RUN_BINARY.notValid(envBinaryPath))(err.message)
      })
    }

    return state.getBinaryDir()
  })
  .then(state.getBinaryPkgAsync)
  .then((pkg: any) => {
    const versions = {
      binary: state.getBinaryPkgVersion(pkg),
      electronVersion: state.getBinaryElectronVersion(pkg),
      electronNodeVersion: state.getBinaryElectronNodeVersion(pkg),
    }

    debug('binary versions %o', versions)

    return versions
  })
  .then((binaryVersions: any) => {
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

const versionsModule = {
  getVersions,
}

export default versionsModule
