/* eslint-disable no-console */
const spawn = require('./spawn')
const util = require('../util')
const state = require('../tasks/state')
const os = require('os')

const start = (options = {}) => {
  const args = ['--mode=info']

  return spawn.start(args, {
    dev: options.dev,
  }).then(() => {
    console.log()

    return util.getOsVersionAsync().then((osVersion) => {
      console.log('Cypress Version: %s', util.pkgVersion())
      console.log('System Platform: %s (%s)', os.platform(), osVersion)
      console.log('System Memory: %d free %d', os.totalmem(), os.freemem())
    })
  })
  .then(() => {
    console.log()
    console.log('Application Data:', util.getApplicationDataFolder())
    console.log('Browser Profiles:', util.getApplicationDataFolder('browsers'))
    console.log('Binary Caches: %s', state.getCacheDir())
  })
}

module.exports = {
  start,
}
