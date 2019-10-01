// override tty if we're being forced to
require('./lib/util/tty').override()

if (process.env.CY_NET_PROFILE && process.env.CYPRESS_ENV) {
  const netProfiler = require('./lib/util/net_profiler')()

  process.stdout.write(`Network profiler writing to ${netProfiler.logPath}\n`)
}

process.env.UV_THREADPOOL_SIZE = 128
require('graceful-fs').gracefulify(require('fs'))
// if running in production mode (CYPRESS_ENV)
// all transpile should have been done already
// and these calls should do nothing
require('@packages/ts/register')
require('@packages/coffee/register')

require && require.extensions && delete require.extensions['.litcoffee']
require && require.extensions && delete require.extensions['.coffee.md']

// warn when deprecated callback apis are used in electron
// https://github.com/electron/electron/blob/master/docs/api/process.md#processenablepromiseapis
process.enablePromiseAPIs = process.env.CYPRESS_ENV !== 'production'

// don't emit the NODE_TLS_REJECT_UNAUTHORIZED warning while
// we work on proper SSL verification
// https://github.com/cypress-io/cypress/issues/5248
const originalEmitWarning = process.emitWarning

process.emitWarning = (warning, options) => {
  if (warning && warning.includes && warning.includes('NODE_TLS_REJECT_UNAUTHORIZED')) {
    return
  }

  return originalEmitWarning.call(process, warning, options)
}

module.exports = require('./lib/cypress').start(process.argv)
