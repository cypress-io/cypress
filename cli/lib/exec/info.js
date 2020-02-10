/* eslint-disable no-console */
const spawn = require('./spawn')
const util = require('../util')
const state = require('../tasks/state')
const os = require('os')
const chalk = require('chalk')
const prettyBytes = require('pretty-bytes')
const _ = require('lodash')

// color for numbers and show values
const g = chalk.green
// color for paths
const p = chalk.cyan
// urls
const link = chalk.blue.underline

const findProxyEnvironmentVariables = () => {
  return _.pick(process.env, ['HTTP_PROXY', 'HTTPS_PROXY', 'NO_PROXY'])
}

const start = (options = {}) => {
  const args = ['--mode=info']

  return spawn.start(args, {
    dev: options.dev,
  }).then(() => {
    console.log()

    return util.getOsVersionAsync().then((osVersion) => {
      console.log('Cypress Version: %s', g(util.pkgVersion()))
      console.log('System Platform: %s (%s)', g(os.platform()), g(osVersion))
      console.log('System Memory: %s free %s', g(prettyBytes(os.totalmem())), g(prettyBytes(os.freemem())))
    })
  })
  .then(() => {
    console.log()
    console.log('Application Data:', p(util.getApplicationDataFolder()))
    console.log('Browser Profiles:', p(util.getApplicationDataFolder('browsers')))
    console.log('Binary Caches: %s', p(state.getCacheDir()))

    console.log()
    const proxyVars = findProxyEnvironmentVariables()

    if (_.isEmpty(proxyVars)) {
      console.log('Did not detect any environment variables controlling proxy settings')
    } else {
      console.log('Proxy environment variables:')
      _.forEach(proxyVars, (value, key) => {
        console.log('%s: %s', key, g(value))
      })

      console.log()
      console.log('Learn More: %s', link('https://on.cypress.io/proxy-configuration'))
    }
  })
}

module.exports = {
  start,
}
