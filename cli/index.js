const minimist = require('minimist')
const debug = require('debug')('cypress:cli')

const args = minimist(process.argv.slice(2))

function installingFromNpmAsAUser () {
  // when installing from monorepo we explicitly
  // opt out of downloading. if we aren't running
  // from the root monorepo, then go ahead and
  // download and install cypress binary
  return process.env.CYPRESS_DOWNLOAD !== "0"
}

// we're being used from the command line
switch (args.exec) {
  case 'install':
    // only go out and download the cypress
    // binary if we're consuming this as an
    // npm package
    if (installingFromNpmAsAUser()) {
      debug('installing Cypress from NPM')
      require('./lib/download')
        .install()
        .catch(console.error) // eslint-disable-line no-console
    }
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
    module.exports = require("./lib/cypress")
}
