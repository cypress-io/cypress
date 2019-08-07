// override tty if we're being forced to
require('./lib/util/tty').override()

// fix for Node v8.9.3 not resolving localhost if system is offline
// this can be removed as soon as we pass Node v8.10.0
// https://github.com/cypress-io/cypress/issues/4763
require('node-offline-localhost').ifOffline()

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

module.exports = require('./lib/cypress').start(process.argv)
