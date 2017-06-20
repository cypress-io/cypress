const downloadUtils = require('../download/utils')
const spawn = require('./spawn')
const debug = require('debug')('cypress:cli')

module.exports = {
  start (options = {}) {
    const args = []

    if (options.env) {
      args.push('--env', options.env)
    }

    if (options.config) {
      args.push('--config', options.config)
    }

    if (options.port) {
      args.push('--port', options.port)
    }
    debug('opening from options %j', options)
    debug('command line arguments %j', args)

    return downloadUtils.verify()
    .then(() => {
      return spawn.start(args, {
        detached: Boolean(options.detached),
        stdio: ['ignore', 'ignore', 'ignore'],
      })
    })
  },
}
