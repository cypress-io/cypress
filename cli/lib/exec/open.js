const debug = require('debug')('cypress:cli')
const util = require('../util')
const spawn = require('./spawn')
const verify = require('../tasks/verify')

module.exports = {
  start (options = {}) {
    if (!util.isInstalledGlobally() && !options.global && !options.project) {
      options.project = process.cwd()
    }

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

    if (options.project) {
      args.push('--project', options.project)
    }

    debug('opening from options %j', options)
    debug('command line arguments %j', args)

    return verify.start()
    .then(() => {
      return spawn.start(args, {
        detached: Boolean(options.detached),
        stdio: 'inherit',
      })
    })
  },
}
