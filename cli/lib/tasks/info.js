const _ = require('lodash')
const os = require('os')
const path = require('path')
const debug = require('debug')('cypress:cli')
const la = require('lazy-ass')
const is = require('check-more-types')

const fs = require('../fs')

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

const getInfoFilePath = (getInstallationDir) => {
  const infoPath = path.join(getInstallationDir(), 'info.json')
  debug('path to info.json file %s', infoPath)
  return infoPath
}

const getInstalledVersion = (getInstallationDir) => {
  la(is.fn(getInstallationDir), 'missing installation dir function')
  return ensureFileInfoContents(getInstallationDir)
  .tap(debug)
  .get('version')
}

const getVerifiedVersion = (getInstallationDir) => {
  la(is.fn(getInstallationDir), 'missing getInstallationDir')
  return ensureFileInfoContents(getInstallationDir).get('verifiedVersion')
}

const ensureInstallationDir = (getInstallationDir) => {
  return fs.ensureDirAsync(getInstallationDir())
}

const clearVersionState = (getInstallationDir) => {
  return ensureFileInfoContents(getInstallationDir)
  .then((contents) => {
    return writeInfoFileContents(_.omit(contents, 'version', 'verifiedVersion'))
  })
}

const writeInstalledVersion = (version, getInstallationDir) => {
  return ensureFileInfoContents(getInstallationDir)
  .then((contents) => {
    const info = _.extend(contents, { version })
    return writeInfoFileContents(info, getInstallationDir)
  })
}

const getPathToExecutable = (getInstallationDir) => {
  return path.join(getInstallationDir(), getPlatformExecutable())
}

const getPathToUserExecutableDir = (getInstallationDir) => {
  la(is.fn(getInstallationDir), 'missing installation dir function')
  return path.join(getInstallationDir(), getPlatformExecutable().split('/')[0])
}

const getInfoFileContents = (getInstallationDir) => {
  return fs.readJsonAsync(getInfoFilePath(getInstallationDir))
}

const ensureFileInfoContents = (getInstallationDir) => {
  return getInfoFileContents(getInstallationDir).catch(() => {
    debug('could not read info file')
    return {}
  })
}

const writeInfoFileContents = (contents, getInstallationDir) => {
  la(is.fn(getInstallationDir), 'missing install dir function')
  const filePath = getInfoFilePath(getInstallationDir)
  return fs.outputJsonAsync(filePath, contents, {
    spaces: 2,
  })
}

module.exports = {
  clearVersionState,
  writeInfoFileContents,
  ensureInstallationDir,
  ensureFileInfoContents,
  getInfoFilePath,
  getVerifiedVersion,
  getInstalledVersion,
  getPathToUserExecutableDir,
  getPathToExecutable,
  writeInstalledVersion,
}
