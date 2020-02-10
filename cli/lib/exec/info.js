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

    return util.getPlatformInfo().then((platform) => {
      console.log(platform)
      // should we do human-friendly conversion?
      console.log('Total memory: %d free %d', os.totalmem(), os.freemem())
    })
  })
  .then(() => {
    console.log()

    console.log('Cypress binary cached in folder: %s', state.getCacheDir())
  })
}

module.exports = {
  start,
}
