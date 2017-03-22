const os = require('os')
const path = require('path')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs-extra'))

// const fileExistsAtPath = (filePath, options = {}) => {
//   _.defaults(options, {
//     catch: true,
//   })
//
//   return fs.statAsync(filePath)
//   .bind(this)
//   .return(filePath)
//   .catch((err) => {
//     //// allow us to bubble up the error if catch is false
//     if (options.catch === false) {
//       throw err
//     }
//
//     /* eslint-disable no-console */
//     console.log('')
//     console.log(chalk.bgRed.white(' -Error- '))
//     console.log(chalk.red.underline('The Cypress App could not be found.'))
//     console.log('Expected the app to be found here:', chalk.blue(filePath))
//     console.log('')
//     console.log(chalk.yellow('To fix this do (one) of the following:'))
//     console.log('1. Reinstall Cypress with:', chalk.cyan('cypress install'))
//     console.log('2. If Cypress is stored in another location, move it to the expected location')
//     //// TODO talk about how to permanently change the path to the cypress executable
//     // console.log('3. Specify the existing location of Cypress with:', chalk.cyan('cypress run --cypress path/to/cypress'))
//     console.log('')
//     process.exit(1)
//     /* eslint-disable no-console */
//   })
// }

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
  return path.join(__dirname, 'app')
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

// const getPathToExecutable = () => {
//   return path.join(getInstallationDir(), getPlatformExecutable())
// }

const getPathToUserExecutable = () => {
  return path.join(getInstallationDir(), getPlatformExecutable().split("/")[0])
}

const getVersionFilePath = () => {
  return path.join(getInstallationDir(), 'version')
}

module.exports = {
  ensureInstallationDir,
  getInstallationDir,
  getInstalledVersion,
  getPathToUserExecutable,
  log,
  writeInstalledVersion,
}
