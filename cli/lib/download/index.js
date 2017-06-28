const path = require('path')
const _ = require('lodash')
const chalk = require('chalk')
const fs = require('fs')
const debug = require('debug')('cypress:cli')
const download = require('./download')
const utils = require('./utils')
const unzip = require('./unzip')

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

    if (fs.existsSync(needVersion)) {
      utils.log('Installing local Cypress binary from %s', needVersion)
      return unzip.start({
        zipDestination: needVersion,
        destination: utils.getInstallationDir(),
        executable: utils.getPathToUserExecutable(),
      })
      .then(() => utils.writeInstalledVersion('unknown'))
    }

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
