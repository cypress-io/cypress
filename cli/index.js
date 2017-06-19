const minimist = require('minimist')
const debug = require('debug')('cypress:cli')
const args = minimist(process.argv.slice(2))

// we're being used from the command line
switch (args.exec) {
  case 'install':
    debug('installing Cypress from NPM')
    require('./lib/download')
      .install()
      .catch(console.error) // eslint-disable-line no-console
    break
  case 'verify':
    // for simple testing in the monorepo
    debug('verifying Cypress')
    require('./lib/download/utils')
      .verify()
      .catch(console.error) // eslint-disable-line no-console
    break
  default:
    // export our node module interface
    module.exports = require('./lib/cypress')
}
