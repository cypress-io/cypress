const _ = require('lodash')
const os = require('os')
const path = require('path')
const untildify = require('untildify')
const debug = require('debug')('cypress:cli')

const fs = require('../fs')
const util = require('../util')

const getPlatformExecutable = () => {
  const platform = os.platform()

  switch (platform) {
    case 'darwin': return 'Contents/MacOS/Cypress'
    case 'linux': return 'Cypress'
    case 'win32': return 'Cypress.exe'
      // TODO handle this error using our standard
    default: throw new Error(`Platform: "${platform}" is not supported.`)
  }
}

const getPlatFormBinaryFolder = () => {
  const platform = os.platform()

  switch (platform) {
    case 'darwin': return 'Cypress.app'
    case 'linux': return 'Cypress'
    case 'win32': return 'Cypress'
      // TODO handle this error using our standard
    default: throw new Error(`Platform: "${platform}" is not supported.`)
  }
}

const getBinaryPkgPath = (binaryDir) => {
  const platform = os.platform()

  switch (platform) {
    case 'darwin': return path.join(binaryDir, 'Contents', 'Resources', 'app', 'package.json')
    case 'linux': return path.join(binaryDir, 'resources', 'app', 'package.json')
    case 'win32': return path.join(binaryDir, 'resources', 'app', 'package.json')
      // TODO handle this error using our standard
    default: throw new Error(`Platform: "${platform}" is not supported.`)
  }
}

/**
 * Get path to binary directory
*/
const getBinaryDir = (version = util.pkgVersion()) => {
  return path.join(getVersionDir(version), getPlatFormBinaryFolder())
}

const getVersionDir = (version = util.pkgVersion(), buildInfo = util.pkgBuildInfo()) => {
  if (buildInfo && !buildInfo.stable) {
    version = ['beta', version, buildInfo.commitBranch, buildInfo.commitSha.slice(0, 8)].join('-')
  }

  return path.join(getCacheDir(), version)
}

/**
 * When executing "npm postinstall" hook, the working directory is set to
 * "<current folder>/node_modules/cypress", which can be surprising when using relative paths.
 */
const isInstallingFromPostinstallHook = () => {
  // individual folders
  const cwdFolders = process.cwd().split(path.sep)
  const length = cwdFolders.length

  return cwdFolders[length - 2] === 'node_modules' && cwdFolders[length - 1] === 'cypress'
}

const getCacheDir = () => {
  let cache_directory = util.getCacheDir()

  if (util.getEnv('CYPRESS_CACHE_FOLDER')) {
    const envVarCacheDir = untildify(util.getEnv('CYPRESS_CACHE_FOLDER'))

    debug('using environment variable CYPRESS_CACHE_FOLDER %s', envVarCacheDir)

    if (!path.isAbsolute(envVarCacheDir) && isInstallingFromPostinstallHook()) {
      const packageRootFolder = path.join('..', '..', envVarCacheDir)

      cache_directory = path.resolve(packageRootFolder)
      debug('installing from postinstall hook, original root folder is %s', packageRootFolder)
      debug('and resolved cache directory is %s', cache_directory)
    } else {
      cache_directory = path.resolve(envVarCacheDir)
    }
  }

  return cache_directory
}

const parseRealPlatformBinaryFolderAsync = (binaryPath) => {
  return fs.realpathAsync(binaryPath)
  .then((realPath) => {
    debug('CYPRESS_RUN_BINARY has realpath:', realPath)
    if (!realPath.toString().endsWith(getPlatformExecutable())) {
      return false
    }

    if (os.platform() === 'darwin') {
      return path.resolve(realPath, '..', '..', '..')
    }

    return path.resolve(realPath, '..')
  })
}

const getDistDir = () => {
  return path.join(__dirname, '..', '..', 'dist')
}

/**
 * Returns full filename to the file that keeps the Test Runner verification state as JSON text.
 * Note: the binary state file will be stored one level up from the given binary folder.
 * @param {string} binaryDir - full path to the folder holding the binary.
 */
const getBinaryStatePath = (binaryDir) => {
  return path.join(binaryDir, '..', 'binary_state.json')
}

const getBinaryStateContentsAsync = (binaryDir) => {
  const fullPath = getBinaryStatePath(binaryDir)

  return fs.readJsonAsync(fullPath)
  .catch({ code: 'ENOENT' }, SyntaxError, () => {
    debug('could not read binary_state.json file at "%s"', fullPath)

    return {}
  })
}

const getBinaryVerifiedAsync = (binaryDir) => {
  return getBinaryStateContentsAsync(binaryDir)
  .tap(debug)
  .get('verified')
}

const clearBinaryStateAsync = (binaryDir) => {
  return fs.removeAsync(getBinaryStatePath(binaryDir))
}

/**
 * Writes the new binary status.
 * @param {boolean} verified The new test runner state after smoke test
 * @param {string} binaryDir Folder holding the binary
 * @returns {Promise<void>} returns a promise
 */
const writeBinaryVerifiedAsync = (verified, binaryDir) => {
  return getBinaryStateContentsAsync(binaryDir)
  .then((contents) => {
    return fs.outputJsonAsync(
      getBinaryStatePath(binaryDir),
      _.extend(contents, { verified }),
      { spaces: 2 },
    )
  })
}

const getPathToExecutable = (binaryDir) => {
  return path.join(binaryDir, getPlatformExecutable())
}

/**
 * Resolves with an object read from the binary app package.json file.
 * If the file does not exist resolves with null
 */
const getBinaryPkgAsync = (binaryDir) => {
  const pathToPackageJson = getBinaryPkgPath(binaryDir)

  debug('Reading binary package.json from:', pathToPackageJson)

  return fs.pathExistsAsync(pathToPackageJson)
  .then((exists) => {
    if (!exists) {
      return null
    }

    return fs.readJsonAsync(pathToPackageJson)
  })
}

const getBinaryPkgVersion = (o) => _.get(o, 'version', null)
const getBinaryElectronVersion = (o) => _.get(o, 'electronVersion', null)
const getBinaryElectronNodeVersion = (o) => _.get(o, 'electronNodeVersion', null)

module.exports = {
  getPathToExecutable,
  getPlatformExecutable,
  // those names start to sound like Java
  getBinaryElectronNodeVersion,
  getBinaryElectronVersion,
  getBinaryPkgVersion,
  getBinaryVerifiedAsync,
  getBinaryPkgAsync,
  getBinaryPkgPath,
  getBinaryDir,
  getCacheDir,
  clearBinaryStateAsync,
  writeBinaryVerifiedAsync,
  parseRealPlatformBinaryFolderAsync,
  getDistDir,
  getVersionDir,
}
