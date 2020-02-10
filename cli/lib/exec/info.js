/* eslint-disable no-console */
const spawn = require('./spawn')
const util = require('../util')

const start = (options = {}) => {
  const args = ['--mode=info']

  return spawn.start(args, {
    dev: options.dev,
  }).then(() => {
    console.log()

    return util.getPlatformInfo().then(console.log)
  })
}

module.exports = {
  start,
}
