/* eslint-disable no-console */
const spawn = require('./spawn')
const util = require('../util')
const state = require('../tasks/state')

const start = (options = {}) => {
  const args = ['--mode=info']

  return spawn.start(args, {
    dev: options.dev,
  }).then(() => {
    console.log()

    return util.getPlatformInfo().then(console.log)
  })
  .then(() => {
    console.log()

    console.log('Cypress binary cached in folder: %s', state.getCacheDir())
  })
}

module.exports = {
  start,
}
