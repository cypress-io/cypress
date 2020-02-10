/* eslint-disable no-console */
const spawn = require('./spawn')
const util = require('../util')
const state = require('../tasks/state')
const os = require('os')
const chalk = require('chalk')

// color for numbers and show values
const g = chalk.green
// color for paths
const p = chalk.cyan

const start = (options = {}) => {
  const args = ['--mode=info']

  return spawn.start(args, {
    dev: options.dev,
  }).then(() => {
    console.log()

    return util.getOsVersionAsync().then((osVersion) => {
      console.log('Cypress Version: %s', g(util.pkgVersion()))
      console.log('System Platform: %s (%s)', g(os.platform()), g(osVersion))
      console.log('System Memory: %s free %s', g(os.totalmem()), g(os.freemem()))
    })
  })
  .then(() => {
    console.log()
    console.log('Application Data:', p(util.getApplicationDataFolder()))
    console.log('Browser Profiles:', p(util.getApplicationDataFolder('browsers')))
    console.log('Binary Caches: %s', p(state.getCacheDir()))
  })
}

module.exports = {
  start,
}
