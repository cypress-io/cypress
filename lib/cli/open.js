const utils = require('./utils')

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

    return utils.spawn(args, {
      detached: true,
      stdio: ['ignore', 'ignore', 'ignore'],
    })
  },
}
