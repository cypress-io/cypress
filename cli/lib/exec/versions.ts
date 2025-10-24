import Debug from 'debug'
import path from 'path'
import util from '../util'
import state from '../tasks/state'
import { throwFormErrorText, errors } from '../errors'

const debug = Debug('cypress:cli')

const getBinaryDirectory = async (): Promise<string> => {
  if (util.getEnv('CYPRESS_RUN_BINARY')) {
    let envBinaryPath = path.resolve(util.getEnv('CYPRESS_RUN_BINARY') as string)

    try {
      const envBinaryDir = await state.parseRealPlatformBinaryFolderAsync(envBinaryPath)

      if (!envBinaryDir) {
        const raiseErrorFn = throwFormErrorText(errors.CYPRESS_RUN_BINARY.notValid(envBinaryPath))

        await raiseErrorFn()
      }

      debug('CYPRESS_RUN_BINARY has binaryDir:', envBinaryDir)

      return envBinaryDir
    } catch (err: any) {
      const raiseErrorFn = throwFormErrorText(errors.CYPRESS_RUN_BINARY.notValid(envBinaryPath))

      await raiseErrorFn(err.message)
    }
  }

  return state.getBinaryDir()
}

const getVersions = async (): Promise<any> => {
  const binDir = await getBinaryDirectory()

  const pkg = await state.getBinaryPkgAsync(binDir)

  const versions = {
    binary: state.getBinaryPkgVersion(pkg),
    electronVersion: state.getBinaryElectronVersion(pkg),
    electronNodeVersion: state.getBinaryElectronNodeVersion(pkg),
  }

  debug('binary versions %o', versions)

  const buildInfo = util.pkgBuildInfo()

  let packageVersion = util.pkgVersion()

  if (!buildInfo) packageVersion += ' (development)'
  else if (!buildInfo.stable) packageVersion += ' (pre-release)'

  const versionsFinal = {
    package: packageVersion,
    binary: versions.binary || 'not installed',
    electronVersion: versions.electronVersion || 'not found',
    electronNodeVersion: versions.electronNodeVersion || 'not found',
  }

  debug('combined versions %o', versions)

  return versionsFinal
}

const versionsModule = {
  getVersions,
}

export default versionsModule
