const _ = require('lodash')
const debug = require('debug')('cypress:cli:run')

const util = require('../util')
const spawn = require('./spawn')
const verify = require('../tasks/verify')
const { exitWithError, errors } = require('../errors')
const { processTestingType, throwInvalidOptionError, checkConfigFile } = require('./shared')

/**
 * Typically a user passes a string path to the project.
 * But "cypress open" allows using `false` to open in global mode,
 * and the user can accidentally execute `cypress run --project false`
 * which should be invalid.
 */
const isValidProject = (v) => {
  if (typeof v === 'boolean') {
    return false
  }

  if (v === '' || v === 'false' || v === 'true') {
    return false
  }

  return true
}

/**
 * Maps options collected by the CLI
 * and forms list of CLI arguments to the server.
 *
 * Note: there is lightweight validation, with errors
 * thrown synchronously.
 *
 * @returns {string[]} list of CLI arguments
 */
const processRunOptions = (options = {}) => {
  debug('processing run options %o', options)

  if (!isValidProject(options.project)) {
    debug('invalid project option %o', { project: options.project })

    return throwInvalidOptionError(errors.invalidRunProjectPath)
  }

  const args = ['--run-project', options.project]

  if (options.browser) {
    args.push('--browser', options.browser)
  }

  if (options.ciBuildId) {
    args.push('--ci-build-id', options.ciBuildId)
  }

  if (options.config) {
    args.push('--config', options.config)
  }

  if (options.configFile !== undefined) {
    checkConfigFile(options)
    args.push('--config-file', options.configFile)
  }

  if (options.env) {
    args.push('--env', options.env)
  }

  if (options.exit === false) {
    args.push('--no-exit')
  }

  if (options.group) {
    args.push('--group', options.group)
  }

  if (options.headed) {
    args.push('--headed', options.headed)
  }

  if (options.headless) {
    if (options.headed) {
      return throwInvalidOptionError(errors.incompatibleHeadlessFlags)
    }

    args.push('--headed', !options.headless)
  }

  // if key is set use that - else attempt to find it by environment variable
  if (options.key == null) {
    debug('--key is not set, looking up environment variable CYPRESS_RECORD_KEY')
    options.key = util.getEnv('CYPRESS_RECORD_KEY')
  }

  // if we have a key assume we're in record mode
  if (options.key) {
    args.push('--key', options.key)
  }

  if (options.outputPath) {
    args.push('--output-path', options.outputPath)
  }

  if (options.parallel) {
    args.push('--parallel')
  }

  if (options.port) {
    args.push('--port', options.port)
  }

  if (options.quiet) {
    args.push('--quiet')
  }

  // if record is defined and we're not
  // already in ci mode, then send it up
  if (options.record != null) {
    args.push('--record', options.record)
  }

  // if we have a specific reporter push that into the args
  if (options.reporter) {
    args.push('--reporter', options.reporter)
  }

  // if we have a specific reporter push that into the args
  if (options.reporterOptions) {
    args.push('--reporter-options', options.reporterOptions)
  }

  // if we have specific spec(s) push that into the args
  if (options.spec) {
    args.push('--spec', options.spec)
  }

  if (options.tag) {
    args.push('--tag', options.tag)
  }

  if (options.inspect) {
    args.push('--inspect')
  }

  if (options.inspectBrk) {
    args.push('--inspectBrk')
  }

  args.push(...processTestingType(options))

  return args
}

module.exports = {
  processRunOptions,
  isValidProject,
  // resolves with the number of failed tests
  start (options = {}) {
    _.defaults(options, {
      key: null,
      spec: null,
      reporter: null,
      reporterOptions: null,
      project: process.cwd(),
    })

    function run () {
      try {
        const args = processRunOptions(options)

        debug('run to spawn.start args %j', args)

        return spawn.start(args, {
          dev: options.dev,
        })
      } catch (err) {
        if (err.details) {
          return exitWithError(err.details)()
        }

        throw err
      }
    }

    if (options.dev) {
      return run()
    }

    return verify.start()
    .then(run)
  },
}
