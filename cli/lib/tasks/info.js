const _ = require('lodash')
const os = require('os')
const path = require('path')
const debug = require('debug')('cypress:cli')

const fs = require('../fs')

const getPlatformExecutable = () => {
  const platform = os.platform()
  switch (platform) {
    case 'darwin': return 'Cypress.app/Contents/MacOS/Cypress'
    case 'linux': return 'Cypress/Cypress'
      // TODO handle this error using our standard
    default: throw new Error(`Platform: "${platform}" is not supported.`)
  }
}

const getInstallationDir = () => {
  return path.join(__dirname, '..', '..', 'dist')
}

const getInfoFilePath = () => {
  const infoPath = path.join(getInstallationDir(), 'info.json')
  debug('path to info.json file %s', infoPath)
  return infoPath
}

const getInstalledVersion = () => {
  return ensureFileInfoContents()
  .tap(debug)
  .get('version')
}

const getVerifiedVersion = () => {
  return ensureFileInfoContents().get('verifiedVersion')
}

const ensureInstallationDir = () => {
  return fs.ensureDirAsync(getInstallationDir())
}

const clearVersionState = () => {
  return ensureFileInfoContents()
  .then((contents) => {
    return writeInfoFileContents(_.omit(contents, 'version', 'verifiedVersion'))
  })
}

const writeInstalledVersion = (version) => {
  return ensureFileInfoContents()
  .then((contents) => {
    return writeInfoFileContents(_.extend(contents, { version }))
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
}

const ensureFileInfoContents = () => {
  return getInfoFileContents().catch(() => {
    debug('could not read info file')
    return {}
  })
}

const writeInfoFileContents = (contents) => {
  return fs.outputJsonAsync(getInfoFilePath(), contents, {
    spaces: 2,
  })
}

module.exports = {
  clearVersionState,
  writeInfoFileContents,
  ensureInstallationDir,
  ensureFileInfoContents,
  getVerifiedVersion,
  getInstallationDir,
  getInstalledVersion,
  getPathToUserExecutableDir,
  getPathToExecutable,
  writeInstalledVersion,
}
