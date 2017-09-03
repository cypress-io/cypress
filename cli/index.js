const minimist = require('minimist')
const debug = require('debug')('cypress:cli')
const args = minimist(process.argv.slice(2))
const util = require('./lib/util')
const logger = require('./lib/logger')

const reportError = (err) => {
  logger.error(err)
  util.exit1()
}

// we're being used from the command line
switch (args.exec) {
  case 'install':
    debug('installing Cypress from NPM')

    require('./lib/tasks')
    .install()
    .catch(reportError)

    break
  case 'verify':
    // for simple testing in the monorepo
    debug('verifying Cypress')

    require('./lib/tasks')
    .verify()
    .catch(reportError)

    break
  default:
    // export our node module interface
    module.exports = require('./lib/cypress')
}
