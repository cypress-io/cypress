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
const red = chalk.red
// urls
const link = chalk.blue.underline

// to be exported
const methods = {}

methods.findProxyEnvironmentVariables = () => {
  return _.pick(process.env, ['HTTP_PROXY', 'HTTPS_PROXY', 'NO_PROXY'])
}

const maskSensitiveVariables = (obj) => {
  const masked = { ...obj }

  if (masked.CYPRESS_RECORD_KEY) {
    masked.CYPRESS_RECORD_KEY = '<redacted>'
  }

  return masked
}

methods.findCypressEnvironmentVariables = () => {
  const isCyVariable = (val, key) => key.startsWith('CYPRESS_')

  return _.pickBy(process.env, isCyVariable)
}

const formatCypressVariables = () => {
  const vars = methods.findCypressEnvironmentVariables()

  return maskSensitiveVariables(vars)
}

methods.start = async (options = {}) => {
  const args = ['--mode=info']

  await spawn.start(args, {
    dev: options.dev,
  })

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

  const cyVars = formatCypressVariables()

  if (_.isEmpty(cyVars)) {
    console.log('Environment Variables: none detected')
  } else {
    console.log('Environment Variables:')
    _.forEach(cyVars, (value, key) => {
      console.log('%s: %s', key, g(value))
    })
  }

  console.log()
  console.log('Application Data:', p(util.getApplicationDataFolder()))
  console.log('Browser Profiles:', p(util.getApplicationDataFolder('browsers')))
  console.log('Binary Caches: %s', p(state.getCacheDir()))

  console.log()

  const osVersion = await util.getOsVersionAsync()
  const buildInfo = util.pkgBuildInfo()
  const isStable = buildInfo && buildInfo.stable

  console.log('Cypress Version: %s', g(util.pkgVersion()), isStable ? g('(stable)') : red('(pre-release)'))
  console.log('System Platform: %s (%s)', g(os.platform()), g(osVersion))
  console.log('System Memory: %s free %s', g(prettyBytes(os.totalmem())), g(prettyBytes(os.freemem())))

  if (!buildInfo) {
    console.log()
    console.log('This is the', red('development'), '(un-built) Cypress CLI.')
  } else if (!isStable) {
    console.log()
    console.log('This is a', red('pre-release'), 'build of Cypress.')
    console.log('Build info:')
    console.log('  Commit SHA:', g(buildInfo.commitSha))
    console.log('  Commit Branch:', g(buildInfo.commitBranch))
    console.log('  Commit Date:', g(buildInfo.commitDate))
  }
}

module.exports = methods
