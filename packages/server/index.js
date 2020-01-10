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

require('./lib/util/suppress_unauthorized_warning').suppress()

module.exports = require('./lib/cypress').start(process.argv)
