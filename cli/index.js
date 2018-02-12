const minimist = require('minimist')
const debug = require('debug')('cypress:cli')
const args = minimist(process.argv.slice(2), {
  string: 'app',
})
const util = require('./lib/util')
const path = require('path')

let getInstallationDir
if (args.app) {
  getInstallationDir = () => path.resolve(args.app)
}

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
    .start({
      getInstallationDir,
      force: true, // always force verification
    })
    .catch(util.logErrorExit1)

    break
  default:
    // export our node module interface
    module.exports = require('./lib/cypress')
}
