const _ = require('lodash')
const debug = require('debug')('cypress:cli')
const spawn = require('./spawn')
const verify = require('../tasks/verify')

// maps options collected by the CLI
// and forms list of CLI arguments to the server
const processRunOptions = (options = {}) => {
  debug('processing run options')
  const args = ['--run-project', options.project]

  /// / if key is set use that - else attempt to find it by env var
  if (options.key == null) {
    debug(
      '--key is not set, looking up environment variable CYPRESS_RECORD_KEY'
    )
    options.key = process.env.CYPRESS_RECORD_KEY || process.env.CYPRESS_CI_KEY
  }

  if (options.env) {
    args.push('--env', options.env)
  }

  if (options.config) {
    args.push('--config', options.config)
  }

  if (options.port) {
    args.push('--port', options.port)
  }

  /// / if we have a specific spec push that into the args
  if (options.spec) {
    args.push('--spec', options.spec)
  }

  /// / if we have a specific reporter push that into the args
  if (options.reporter) {
    args.push('--reporter', options.reporter)
  }

  /// / if we have a specific reporter push that into the args
  if (options.reporterOptions) {
    args.push('--reporter-options', options.reporterOptions)
  }

  if (options.ci) {
    /// / push to display the deprecation message
    args.push('--ci')

    /// / also automatically record
    args.push('--record', true)
  }

  /// / if we have a key assume we're in record mode
  if (options.key) {
    args.push('--key', options.key)
  }

  /// / if record is defined and we're not
  /// / already in ci mode, then send it up
  if (options.record != null && !options.ci) {
    args.push('--record', options.record)
  }

  if (options.outputPath) {
    args.push('--output-path', options.outputPath)
  }

  if (options.browser) {
    args.push('--browser', options.browser)
  }

  if (options.headed) {
    args.push('--headed', options.headed)
  }

  if (options.group != null) {
    args.push('--group', options.group)
  }

  if (options.groupId) {
    args.push('--group-id', options.groupId)
  }

  if (options.parallel != null) {
    args.push('--parallel', options.parallel)
  }

  if (options.parallelId) {
    args.push('--parallel-id', options.parallelId)
  }

  return args
}

const run = options => () => {
  const args = processRunOptions(options)
  debug('run to spawn.start args %j', args)
  return spawn.start(args)
}

module.exports = {
  processRunOptions,
  // resolves with the number of failed tests
  start (options = {}) {
    _.defaults(options, {
      key: null,
      spec: null,
      reporter: null,
      reporterOptions: null,
      project: process.cwd()
    })

    return verify.start().then(run(options))
  }
}
