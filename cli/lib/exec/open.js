const debug = require('debug')('cypress:cli')
const util = require('../util')
const spawn = require('./spawn')
const verify = require('../tasks/verify')
const { processTestingType } = require('./shared')

/**
 * Maps options collected by the CLI
 * and forms list of CLI arguments to the server.
 *
 * Note: there is lightweight validation, with errors
 * thrown synchronously.
 *
 * @returns {string[]} list of CLI arguments
 */
const processOpenOptions = (options = {}) => {
  if (!util.isInstalledGlobally() && !options.global && !options.project) {
    options.project = process.cwd()
  }

  const args = []

  if (options.config) {
    args.push('--config', options.config)
  }

  if (options.configFile !== undefined) {
    args.push('--config-file', options.configFile)
  }

  if (options.browser) {
    args.push('--browser', options.browser)
  }

  if (options.env) {
    args.push('--env', options.env)
  }

  if (options.port) {
    args.push('--port', options.port)
  }

  if (options.project) {
    args.push('--project', options.project)
  }

  if (options.global) {
    args.push('--global', options.global)
  }

  args.push(...processTestingType(options))

  debug('opening from options %j', options)
  debug('command line arguments %j', args)

  return args
}

module.exports = {
  processOpenOptions,
  start (options = {}) {
    const args = processOpenOptions(options)

    function open () {
      return spawn.start(args, {
        dev: options.dev,
        detached: Boolean(options.detached),
        stdio: 'inherit',
      })
    }

    if (options.dev) {
      return open()
    }

    return verify.start()
    .then(open)
  },
}
