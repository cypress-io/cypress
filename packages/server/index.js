// override tty if we're being forced to
require('./lib/util/tty').override()

const electronApp = require('./lib/util/electron-app')

// are we in the main node process or the electron process?
const isRunningElectron = electronApp.isRunning()

if (process.env.CY_NET_PROFILE && isRunningElectron) {
  const netProfiler = require('./lib/util/net_profiler')()

  process.stdout.write(`Network profiler writing to ${netProfiler.logPath}\n`)
}

process.env.UV_THREADPOOL_SIZE = 128

require('graceful-fs').gracefulify(require('fs'))
// if running in production mode (CYPRESS_INTERNAL_ENV)
// all transpile should have been done already
// and these calls should do nothing
require('@packages/ts/register')

if (isRunningElectron) {
  require('./lib/util/process_profiler').start()
}

// warn when deprecated callback apis are used in electron
// https://github.com/electron/electron/blob/master/docs/api/process.md#processenablepromiseapis
process.enablePromiseAPIs = process.env.CYPRESS_INTERNAL_ENV !== 'production'

// don't show any electron deprecation warnings in prod
process.noDeprecation = process.env.CYPRESS_INTERNAL_ENV === 'production'

// always show stack traces for Electron deprecation warnings
process.traceDeprecation = true

require('./lib/util/suppress_unauthorized_warning').suppress()

function launchOrFork () {
  const nodeOptions = require('./lib/util/node_options')

  if (nodeOptions.needsOptions()) {
    // https://github.com/cypress-io/cypress/pull/5492
    return nodeOptions.forkWithCorrectOptions()
  }

  nodeOptions.restoreOriginalOptions()

  module.exports = require('./lib/cypress').start(process.argv)
}

launchOrFork()
