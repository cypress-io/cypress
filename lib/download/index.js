const _ = require('lodash')
const chalk = require('chalk')
const download = require('./download')
const utils = require('./utils')

const packageVersion = require('../../package').version

const install = (options = {}) => {
  _.defaults(options, {
    force: false,
  })

  return utils.getInstalledVersion()
  .catch(() => {
    throw new Error('Cypress executable was not found.')
  })
  .then((installedVersion) => {
    if (options.force) {
      throw new Error('')
    } else if (installedVersion === packageVersion) {
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
