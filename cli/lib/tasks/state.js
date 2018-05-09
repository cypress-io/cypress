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
    case 'darwin': return 'Cypress.app/Contents/MacOS/Cypress'
    case 'linux': return 'Cypress/Cypress'
    case 'win32': return 'Cypress/Cypress.exe'
      // TODO handle this error using our standard
    default: throw new Error(`Platform: "${platform}" is not supported.`)
  }
}

const getBinaryPkgPath = () => {
  const platform = os.platform()
  switch (platform) {
    case 'darwin': return path.join('Cypress.app', 'Contents', 'Resources', 'app', 'package.json')
    case 'linux': return path.join('Cypress', 'resources', 'app', 'package.json')
    case 'win32': return path.join('Cypress', 'resources', 'app', 'package.json')
      // TODO handle this error using our standard
    default: throw new Error(`Platform: "${platform}" is not supported.`)
  }
}

/**
 * Get path to binary directory
*/
const getBinaryDir = (version = util.pkgVersion()) => {
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

const getBinaryStatePath = () => {
  return path.join(getBinaryDir(), 'binary_state.json')
}

const getBinaryStateContentsAsync = () => {
  return fs.readJsonAsync(getBinaryStatePath())
  .catch({ code: 'ENOENT' }, SyntaxError, () => {
    debug('could not read binary_state.json file')
    return {}
  })
}

const getBinaryVerifiedAsync = () => {
  return getBinaryStateContentsAsync()
  .tap(debug)
  .get('verified')
}

const clearBinaryStateAsync = () => {
  return fs.removeAsync(getBinaryDir())
}

/**
 * @param {boolean} verified
 */
const writeBinaryVerifiedAsync = (verified) => {
  return getBinaryStateContentsAsync()
  .then((contents) => {
    return fs.outputJsonAsync(getBinaryStatePath(), _.extend(contents, { verified }), { spaces: 2 })
  })
}

const getPathToExecutable = (binaryDir = getBinaryDir()) => {
  return path.join(binaryDir, getPlatformExecutable())
}

const getPathToExecutableDir = (binaryDir = getBinaryDir()) => {
  return path.join(binaryDir, getPlatformExecutable().split('/')[0])
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
  getPathToExecutableDir,
  getPathToExecutable,
  getBinaryPkgVersionAsync,
  getBinaryVerifiedAsync,
  getBinaryDir,
  getCacheDir,
  clearBinaryStateAsync,
  writeBinaryVerifiedAsync,
  getDistDir,
}
