const minimist = require('minimist')
const debug = require('debug')('cypress:cli')
const args = minimist(process.argv.slice(2))
const util = require('./lib/util')

// we're being used from the command line
switch (args.exec) {
  case 'install':
    debug('installing Cypress from NPM')

    require('./lib/tasks/install')
    .start({ force: args.force })
    .catch(util.logErrorExit1)

    break
  case 'verify':
    // for simple testing in the monorepo
    debug('verifying Cypress')

    require('./lib/tasks/verify')
    .start({ force: true }) // always force verification
    .catch(util.logErrorExit1)

    break
  default:
    debug('exporting Cypress module interface')
    module.exports = require('./lib/cypress')
}
