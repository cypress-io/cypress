const debug = require('debug')('cypress:cli:init')
const util = require('../util')
const spawn = require('./spawn')
const verify = require('../tasks/verify')

module.exports = {
  start (options = {}) {
    if (!util.isInstalledGlobally() && !options.global && !options.project) {
      options.project = process.cwd()
    }

    const args = ['--init-project']

    if (options.force || options.yes) {
      args.push('--force')
    }

    debug('init cypress from options %j', options)
    debug('command line arguments %j', args)

    function init () {
      return spawn.start(args, {
        dev: options.dev,
        detached: Boolean(options.detached),
        stdio: 'inherit',
      })
    }

    if (options.dev) {
      return init()
    }

    return verify.start()
    .then(init)
  },
}
