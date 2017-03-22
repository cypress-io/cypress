const chalk = require('chalk')
const download = require('./download')
const utils = require('./utils')

const packageVersion = require('../../package').version

const install = () => {
  return utils.getInstalledVersion()
  .catch(() => {
    throw new Error('Cypress was not found.')
  })
  .then((installedVersion) => {
    if (installedVersion === packageVersion) {
      utils.log(chalk.green(`Cypress ${packageVersion} already installed.`))
    } else {
      throw new Error(`Installed version (${installedVersion}) does not match package version (${packageVersion}).`)
    }
  })
  .catch((err) => {
    utils.log(err.message, chalk.green(`Installing Cypress (version: ${packageVersion}).`))

    return download.start({
      displayOpen: false,
      cypressVersion: packageVersion,
      version: packageVersion,
    })
  })
}

module.exports = {
  install,
}
