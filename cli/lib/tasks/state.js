const _ = require('lodash')
const os = require('os')
const path = require('path')
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

const getVersionDir = (version = util.pkgVersion()) => {
  return path.join(getCacheDir(), version)
}

const getCacheDir = () => {
  let cache_directory = util.getCacheDir()
  if (util.getEnv('CYPRESS_CACHE_FOLDER')) {
    const envVarCacheDir = util.getEnv('CYPRESS_CACHE_FOLDER')
    debug('using environment variable CYPRESS_CACHE_FOLDER %s', envVarCacheDir)
    cache_directory = path.resolve(envVarCacheDir)
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

const getBinaryStatePath = (binaryDir) => {
  return path.join(binaryDir, 'binary_state.json')
}

const getBinaryStateContentsAsync = (binaryDir) => {
  return fs.readJsonAsync(getBinaryStatePath(binaryDir))
  .catch({ code: 'ENOENT' }, SyntaxError, () => {
    debug('could not read binary_state.json file')
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
 * @param {boolean} verified
 */
const writeBinaryVerifiedAsync = (verified, binaryDir) => {
  return getBinaryStateContentsAsync(binaryDir)
  .then((contents) => {
    return fs.outputJsonAsync(
      getBinaryStatePath(binaryDir),
      _.extend(contents, { verified }),
      { spaces: 2 })
  })
}

const getPathToExecutable = (binaryDir) => {
  return path.join(binaryDir, getPlatformExecutable())
}

const getBinaryPkgVersionAsync = (binaryDir) => {
  const pathToPackageJson = getBinaryPkgPath(binaryDir)
  debug('Reading binary package.json from:', pathToPackageJson)
  return fs.pathExistsAsync(pathToPackageJson)
  .then((exists) => {
    if (!exists) {
      return null
    }
    return fs.readJsonAsync(pathToPackageJson)
    .get('version')
  })
}


module.exports = {
  getPathToExecutable,
  getPlatformExecutable,
  getBinaryPkgVersionAsync,
  getBinaryVerifiedAsync,
  getBinaryPkgPath,
  getBinaryDir,
  getCacheDir,
  clearBinaryStateAsync,
  writeBinaryVerifiedAsync,
  parseRealPlatformBinaryFolderAsync,
  getDistDir,
  getVersionDir,
}
