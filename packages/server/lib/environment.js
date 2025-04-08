require('./util/fs')
const DEFAULT_ELECTRON_FLAGS = require('./util/chromium_flags').DEFAULT_ELECTRON_FLAGS

const os = require('os')

const Promise = require('bluebird')
const debug = require('debug')('cypress:server')

// never cut off stack traces
Error.stackTraceLimit = Infinity

// cannot use relative require statement
// here because when obfuscated package
// would not be available
const pkg = require('@packages/root')

// instead of setting NODE_ENV we will
// use our own separate CYPRESS_INTERNAL_ENV so
// as not to conflict with CI providers

// use env from package first
// or development as default
const env = process.env['CYPRESS_INTERNAL_ENV'] || (process.env['CYPRESS_INTERNAL_ENV'] = pkg.env != null ? pkg.env : 'development')

process.env['CYPRESS'] = 'true'

const config = {
  // uses cancellation for automation timeouts
  cancellation: true,
}

if (env === 'development') {
  // enable long stack traces in dev
  config.longStackTraces = true
}

Promise.config(config)

// NOTE: errors are printed in development mode only
try {
  // i wish we didn't have to do this but we have to append
  // these command line switches immediately
  const {
    app,
  } = require('electron')

  debug('appending default switches for electron: %O', DEFAULT_ELECTRON_FLAGS)
  DEFAULT_ELECTRON_FLAGS.forEach(({ name, value }) => {
    value ? app.commandLine.appendSwitch(name, value) : app.commandLine.appendSwitch(name)
  })

  if (os.platform() === 'linux') {
    app.disableHardwareAcceleration()
  }

  if (process.env.ELECTRON_EXTRA_LAUNCH_ARGS) {
    // regex will be used to convert ELECTRON_EXTRA_LAUNCH_ARGS into an array, for example
    // input: 'foo --ipsum=0 --bar=--baz=quux --lorem="--ipsum=dolor --sit=amet"'
    // output: ['foo', '--ipsum=0', '--bar=--baz=quux', '--lorem="--ipsum=dolor --sit=amet"']
    const regex = /(?:[^\s"']+|"[^"]*"|'[^']*')+/g
    const electronLaunchArguments = process.env.ELECTRON_EXTRA_LAUNCH_ARGS.match(regex) || []

    electronLaunchArguments.forEach((arg) => {
      // arg can be just key --disable-http-cache
      // or key value --remote-debugging-port=8315
      // or key value with another value --foo=--bar=4196
      // or key value with another multiple value --foo='--bar=4196 --baz=quux'
      const [key, ...value] = arg.split('=')

      // because this is an environment variable, everything is a string
      // thus we don't have to worry about casting
      // --foo=false for example will be "--foo", "false"
      if (value.length) {
        let joinedValues = value.join('=')

        // check if the arg is wrapped in " or ' (unicode)
        const isWrappedInQuotes = !!['\u0022', '\u0027'].find(((charAsUnicode) => joinedValues.startsWith(charAsUnicode) && joinedValues.endsWith(charAsUnicode)))

        if (isWrappedInQuotes) {
          joinedValues = joinedValues.slice(1, -1)
        }

        app.commandLine.appendSwitch(key, joinedValues)
      } else {
        app.commandLine.appendSwitch(key)
      }
    })
  }
} catch (e) {
  debug('environment error %s', e.message)
}

module.exports = env
