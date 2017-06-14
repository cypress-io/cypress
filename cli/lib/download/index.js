const _ = require('lodash')
const chalk = require('chalk')
const download = require('./download')
const utils = require('./utils')
const debug = require('debug')('cypress:cli')
const path = require('path')
const packagePath = path.join(__dirname, '..', '..', 'package.json')
const packageVersion = require(packagePath).version

const hasSomethingToSay = (err) => err && err.message

const install = (options = {}) => {
  debug('installing with options %j', options)
  _.defaults(options, {
    force: false,
  })

  let needVersion = packageVersion

  if (process.env.CYPRESS_VERSION) {
    needVersion = process.env.CYPRESS_VERSION
    debug('using CYPRESS_VERSION %s', needVersion)
    utils.log(chalk.yellow(`Forcing CYPRESS_VERSION ${needVersion}`))
  }

  return utils.getInstalledVersion()
  .catch(() => {
    throw new Error('Cypress executable was not found.')
  })
  .then((installedVersion) => {
    if (options.force) {
      return utils.clearVersionState().then(() => {
        throw new Error('')
      })
    } else if (installedVersion === needVersion) {
      utils.log(chalk.green(`Cypress ${needVersion} already installed.`))
    } else if (!installedVersion) {
      utils.log('Could not find installed Cypress')
      return utils.clearVersionState().then(() => {
        throw new Error('')
      })
    } else {
      throw new Error(`Installed version (${installedVersion}) does not match needed version (${needVersion}).`)
    }
  })
  .catch((err) => {
    if (hasSomethingToSay(err)) {
      utils.log(err.message)
    }
    utils.log(chalk.green(`Installing Cypress (version: ${needVersion}).`))

    return download.start({
      displayOpen: false,
      cypressVersion: needVersion,
      version: needVersion,
    })
  })
}

module.exports = {
  install,
}
