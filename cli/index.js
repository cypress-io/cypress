const minimist = require('minimist')
const debug = require('debug')('cypress:cli')
const args = minimist(process.argv.slice(2))

const reportError = (err) => {
  console.error(err) // eslint-disable-line no-console
  process.exit(1)
}

// we're being used from the command line
switch (args.exec) {
  case 'install':
    debug('installing Cypress from NPM')
    require('./lib/download')
      .install()
      .catch(reportError)
    break
  case 'verify':
    // for simple testing in the monorepo
    debug('verifying Cypress')
    require('./lib/download/utils')
      .verify()
      .catch(reportError)
    break
  default:
    // export our node module interface
    module.exports = require('./lib/cypress')
}
