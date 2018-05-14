const _ = require('lodash')
const os = require('os')
const path = require('path')
const debug = require('debug')('cypress:cli')
const cachedir = require('cachedir')

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

const getBinaryPkgPath = () => {
  const platform = os.platform()
  switch (platform) {
    case 'darwin': return path.join('Contents', 'Resources', 'app', 'package.json')
    case 'linux': return path.join('resources', 'app', 'package.json')
    case 'win32': return path.join('resources', 'app', 'package.json')
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
  let cache_directory = cachedir('Cypress')
  if (process.env.CYPRESS_CACHE_DIRECTORY) {
    const envVarCacheDir = process.env.CYPRESS_CACHE_DIRECTORY
    debug('using env var CYPRESS_CACHE_DIRECTORY %s', envVarCacheDir)
    cache_directory = envVarCacheDir
  }
  return cache_directory
}

const getDistDir = () => {
  return path.join(__dirname, '..', '..', 'dist')
}

const getBinaryStatePath = (binaryDir) => {
  return path.join(binaryDir, 'binary_state.json')
}

const getBinaryStateContentsAsync = (binaryDir = getBinaryDir()) => {
  return fs.readJsonAsync(getBinaryStatePath(binaryDir))
  .catch({ code: 'ENOENT' }, SyntaxError, () => {
    debug('could not read binary_state.json file')
    return {}
  })
}

const getBinaryVerifiedAsync = (binaryDir = getBinaryDir()) => {
  return getBinaryStateContentsAsync(binaryDir)
  .tap(debug)
  .get('verified')
}

const clearBinaryStateAsync = (binaryDir = getBinaryDir()) => {
  return fs.removeAsync(path.join(binaryDir, getBinaryStatePath(binaryDir)))
}

/**
 * @param {boolean} verified
 */
const writeBinaryVerifiedAsync = (verified, binaryDir = getBinaryDir()) => {
  return getBinaryStateContentsAsync(binaryDir)
  .then((contents) => {
    return fs.outputJsonAsync(
      getBinaryStatePath(binaryDir),
      _.extend(contents, { verified }),
      { spaces: 2 })
  })
}

const getPathToExecutable = (binaryDir = getBinaryDir()) => {
  return path.join(binaryDir, getPlatformExecutable())
}

const getBinaryPkgVersionAsync = (binaryDir = getBinaryDir()) => {
  const pathToPackageJson = path.join(getBinaryDir(), getBinaryPkgPath(binaryDir))
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
  getBinaryPkgVersionAsync,
  getBinaryVerifiedAsync,
  getBinaryDir,
  getCacheDir,
  clearBinaryStateAsync,
  writeBinaryVerifiedAsync,
  getDistDir,
  getVersionDir,
}
