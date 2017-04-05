const _ = require('lodash')
// const chalk = require('chalk')
const os = require('os')
const path = require('path')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs-extra'))

const packageVersion = require('../../package').version

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
  return getInfoFileContents().get('version')
}

const ensureInstallationDir = () => {
  return fs.ensureDirAsync(getInstallationDir())
}

const writeInstalledVersion = (version) => {
  return getInfoFileContents()
  .catch(() => {
    return {}
  })
  .then((contents) => {
    return writeInfoFileContents(_.extend(contents, { version }))
  })
}

const getPathToExecutable = () => {
  return path.join(getInstallationDir(), getPlatformExecutable())
}

const getPathToUserExecutable = () => {
  return path.join(getInstallationDir(), getPlatformExecutable().split("/")[0])
}

const getInfoFileContents = () => {
  return fs.readJsonAsync(path.join(getInstallationDir(), 'info.json'))
}
const writeInfoFileContents = (contents) => {
  return fs.outputJsonAsync(path.join(getInstallationDir(), 'info.json'), contents)
}

const verify = () => {
  log('Verifying Cypress executable...')

  return getInstalledVersion()
  .catch(() => {
    throw new Error('No version of Cypress executable installed. Run `cypress install` and then try again.')
  })
  .then((installedVersion) => {
    if (installedVersion !== packageVersion) {
      throw new Error(`Installed version (${installedVersion}) does not match package version (${packageVersion}). Run \`cypress install\` and then try again.`)
    }
  })
  .then(() => {
    return fs.statAsync(getPathToExecutable())
    .catch(function () {
      throw new Error('Cypress executable not found. Run `cypress install` and then try again.')
    })
  })
  .catch((err) => {
    log(err.message)
    process.exit(1)
  })

  //// TODO:
  //// then =>
  ////   run smoke test
  ////   catch => throw error about smoke test failing
  //// catch => throw error about it not existing

  //// refactor data about executable to not use 'version' file
  //// make it a json file with the version and whether that version has been verified

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
