const downloadUtils = require('../download/utils')
const spawn = require('./spawn')

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

    return downloadUtils.verify()
    .then(() => {
      return spawn.start(args, {
        detached: false,
        stdio: ['ignore', 'ignore', 'ignore'],
      })
    })
  },
}
