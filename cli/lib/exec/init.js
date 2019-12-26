const debug = require('debug')('cypress:cli:init')
const util = require('../util')
const spawn = require('./spawn')
const verify = require('../tasks/verify')

module.exports = {
  start (options = {}) {
    if (!util.isInstalledGlobally() && !options.global && !options.project) {
      options.project = process.cwd()
    }

    const args = ['--init']

    if (options.config) {
      args.push('--config', options.config)
    }

    if (options.configFile !== undefined) {
      args.push('--config-file', options.configFile)
    }

    if (options.force) {
      args.push('--force')
    }

    if (options.noExample) {
      args.push('--no-example')
    }

    if (options.typescript) {
      args.push('--typescript')
    }

    if (options.eslint === '') {
      args.push('--eslint')
    } else if (options.eslint === 'chai-friendly') {
      args.push('--eslint-chai-friendly')
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
