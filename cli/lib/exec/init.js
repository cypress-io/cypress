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

    if (options.noFixtures) {
      args.push('--no-fixtures')
    }

    if (options.fixturesPath) {
      args.push('--fixtures-path')
      args.push(options.fixturesPath)
    }

    if (options.noSupport) {
      args.push('--no-support')
    }

    if (options.supportPath) {
      args.push('--support-path')
      args.push(options.supportPath)
    }

    if (options.integrationPath) {
      args.push('--integration-path')
      args.push(options.integrationPath)
    }

    if (options.noVideo) {
      args.push('--no-video')
    }

    if (options.example) {
      args.push('--example')
    }

    if (options.typescript || options.ts) {
      args.push('--typescript')
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
