/* eslint-disable no-console */
const spawn = require('./spawn')
const util = require('../util')
const state = require('../tasks/state')
const os = require('os')
const chalk = require('chalk')
const prettyBytes = require('pretty-bytes')
const _ = require('lodash')
const R = require('ramda')

// color for numbers and show values
const g = chalk.green
// color for paths
const p = chalk.cyan
// urls
const link = chalk.blue.underline

// to be exported
const methods = {}

methods.findProxyEnvironmentVariables = () => {
  return _.pick(process.env, ['HTTP_PROXY', 'HTTPS_PROXY', 'NO_PROXY'])
}

const maskSensitiveVariables = R.evolve({
  CYPRESS_RECORD_KEY: R.always('<redacted>'),
})

methods.findCypressEnvironmentVariables = () => {
  const isCyVariable = (val, key) => key.startsWith('CYPRESS_')

  return R.pickBy(isCyVariable)(process.env)
}

const formatCypressVariables = () => {
  const vars = methods.findCypressEnvironmentVariables()

  return maskSensitiveVariables(vars)
}

methods.start = (options = {}) => {
  const args = ['--mode=info']

  return spawn.start(args, {
    dev: options.dev,
  })
  .then(() => {
    console.log()
    const proxyVars = methods.findProxyEnvironmentVariables()

    if (_.isEmpty(proxyVars)) {
      console.log('Proxy Settings: none detected')
    } else {
      console.log('Proxy Settings:')
      _.forEach(proxyVars, (value, key) => {
        console.log('%s: %s', key, g(value))
      })

      console.log()
      console.log('Learn More: %s', link('https://on.cypress.io/proxy-configuration'))
      console.log()
    }
  })
  .then(() => {
    const cyVars = formatCypressVariables()

    if (_.isEmpty(cyVars)) {
      console.log('Environment Variables: none detected')
    } else {
      console.log('Environment Variables:')
      _.forEach(cyVars, (value, key) => {
        console.log('%s: %s', key, g(value))
      })
    }
  })
  .then(() => {
    console.log()
    console.log('Application Data:', p(util.getApplicationDataFolder()))
    console.log('Browser Profiles:', p(util.getApplicationDataFolder('browsers')))
    console.log('Binary Caches: %s', p(state.getCacheDir()))
  })
  .then(() => {
    console.log()

    return util.getOsVersionAsync().then((osVersion) => {
      console.log('Cypress Version: %s', g(util.pkgVersion()))
      console.log('System Platform: %s (%s)', g(os.platform()), g(osVersion))
      console.log('System Memory: %s free %s', g(prettyBytes(os.totalmem())), g(prettyBytes(os.freemem())))
    })
  })
}

module.exports = methods
