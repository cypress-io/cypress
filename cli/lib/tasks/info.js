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

const getInstallationDir = (version = util.pkgVersion()) => {
  return getInfoFileContents()
  .tap(debug)
  .get('install_directory')
  .catch(() => {
    let cache_directory = cachedir('Cypress')

    if (process.env.CYPRESS_CACHE_DIRECTORY) {
      const envVarCacheDir = process.env.CYPRESS_CACHE_DIRECTORY
      debug('using env var CYPRESS_CACHE_DIRECTORY %s', envVarCacheDir)
      cache_directory = envVarCacheDir
    }
    return path.join(cache_directory, version)
  })
}

const getDistDirectory = () => {
  return path.join(__dirname, '..', '..', 'dist')
}

const getBinaryInfoFilePath = () => {
  const infoPath = path.join(getInstallationDir(), 'info.json')
  debug('path to info.json file %s', infoPath)
  return infoPath
}

const getInfoFilePath = () => {
  const infoPath = path.join(getDistDirectory(), 'info.json')
  debug('path to info.json file %s', infoPath)
  return infoPath
}

const getInstalledVersion = () => {
  return getInfoFileContents()
  .tap(debug)
  .get('version')
}

const getVerifiedVersion = () => {
  return getBinaryInfoFileContents().get('verifiedVersion')
}

const ensureInstallationDir = () => {
  return fs.ensureDirAsync(getInstallationDir())
}

const clearVersionState = () => {
  return getBinaryInfoFileContents()
  .then((contents) => {
    return writeBinaryInfoFileContents(_.omit(contents, 'verifiedVersion'))
  })
  .then(getInfoFileContents())
  .then((contents) => {
    return writeInfoFileContents(_.omit(contents, 'version'))
  })
}

const writeInstalledVersion = (version) => {
  return getInfoFileContents()
  .then((contents) => {
    return writeInfoFileContents(_.extend(contents, { version }))
  })
}

const writeInstallDirectory = (install_directory) => {
  return getInfoFileContents()
  .then((contents) => {
    return writeInfoFileContents(_.extend(contents, { install_directory }))
  })
}

const getPathToExecutable = () => {
  return path.join(getInstallationDir(), getPlatformExecutable())
}

const getPathToUserExecutableDir = () => {
  return path.join(getInstallationDir(), getPlatformExecutable().split('/')[0])
}

const getInfoFileContents = () => {
  return fs.readJsonAsync(getInfoFilePath())
  .catch(() => {
    debug('could not read info file')
    return {}
  })
}

const getBinaryInfoFileContents = () => {
  return fs.readJsonAsync(getBinaryInfoFilePath())
  .catch(() => {
    debug('could not read info file')
    return {}
  })
}

const writeInfoFileContents = (contents) => {
  return fs.outputJsonAsync(getInfoFilePath(), contents, {
    spaces: 2,
  })
}

const writeBinaryInfoFileContents = (contents) => {
  return fs.outputJsonAsync(getBinaryInfoFilePath(), contents, {
    spaces: 2,
  })
}

module.exports = {
  clearVersionState,
  writeInfoFileContents,
  ensureInstallationDir,
  getInfoFileContents,
  getInfoFilePath,
  getVerifiedVersion,
  getInstallationDir,
  getInstalledVersion,
  getPathToUserExecutableDir,
  getPathToExecutable,
  writeInstalledVersion,
  writeInstallDirectory,
}
