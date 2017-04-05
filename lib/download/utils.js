// const _ = require('lodash')
// const chalk = require('chalk')
const os = require('os')
const path = require('path')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs-extra'))

const log = (...messages) => {
  /* eslint-disable no-console */
  console.log('')
  console.log(...messages)
  console.log('')
  /* eslint-enable no-console */
}

const getPlatformExecutable = () => {
  const platform = os.platform()
  switch (platform) {
    case 'darwin': return 'Cypress.app/Contents/MacOS/Cypress'
    case 'linux': return 'Cypress/Cypress'
    // case 'win32': return 'Cypress/Cypress.exe'
    default: throw new Error(`Platform: '${platform}' is not supported.`)
  }
}

const getInstallationDir = () => {
  return path.join(__dirname, 'dist')
}

const getInstalledVersion = () => {
  return fs.readFileAsync(getVersionFilePath(), 'utf8')
  .catch(() => null)
}

const ensureInstallationDir = () => {
  return fs.ensureDirAsync(getInstallationDir())
}

const writeInstalledVersion = (version) => {
  return fs.writeFileAsync(getVersionFilePath(), version)
}

const getPathToExecutable = () => {
  return path.join(getInstallationDir(), getPlatformExecutable())
}

const getPathToUserExecutable = () => {
  return path.join(getInstallationDir(), getPlatformExecutable().split("/")[0])
}

const getVersionFilePath = () => {
  return path.join(getInstallationDir(), 'version')
}

const verify = () => {
  return fs.statAsync(getPathToExecutable())
  //// TODO:
  //// then =>
  ////   run smoke test
  ////   catch => throw error about smoke test failing
  //// catch => throw error about it not existing

  // console.log(chalk.red.underline('The Cypress App could not be found.'))
  // console.log('Expected the app to be found here:', chalk.blue(options.pathToCypress))
  // console.log('')
  // console.log(chalk.yellow('To fix this do (one) of the following:'))
  // console.log('1. Reinstall Cypress with:', chalk.cyan('cypress install'))
  // console.log('2. If Cypress is stored in another location, move it to the expected location')

}

module.exports = {
  ensureInstallationDir,
  getInstallationDir,
  getInstalledVersion,
  getPathToUserExecutable,
  getPathToExecutable,
  log,
  verify,
  writeInstalledVersion,
}
