if (process.env.TIME_REQUIRE != null) {
  require('time-require')
}

const bench = require('./util/bench').initBenchmark('cold')

bench.time('start')
require('./util/capture-require')
bench.time('launch:init:require:bundle-cache')
require('./util/bundle-cache')
bench.timeEnd('launch:init:require:bundle-cache')

bench.time('launch:init')

// override tty if we're being forced to
require('./lib/util/tty').override()

bench.time('launch:init:require:lib/util/electron-app')
const electronApp = require('./lib/util/electron-app')

bench.timeEnd('launch:init:require:lib/util/electron-app')

// are we in the main node process or the electron process?
const isRunningElectron = electronApp.isRunning()

if (process.env.CY_NET_PROFILE && isRunningElectron) {
  const netProfiler = require('./lib/util/net_profiler')()

  process.stdout.write(`Network profiler writing to ${netProfiler.logPath}\n`)
}

process.env.UV_THREADPOOL_SIZE = 128

bench.time('launch:init:require:graceful-fs')
require('graceful-fs').gracefulify(require('fs'))
bench.timeEnd('launch:init:require:graceful-fs')
// if running in production mode (CYPRESS_INTERNAL_ENV)
// all transpile should have been done already
// and these calls should do nothing
// if we are requiring from bundle, we already took care of this step
if (process.env.REQUIRE_FROM_BUNDLE == null) {
  bench.time('launch:init:require:@packages/ts/register')
  require('@packages/ts/register')
  bench.timeEnd('launch:init:require:@packages/ts/register')
}

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
    // return nodeOptions.forkWithCorrectOptions()
  }

  // nodeOptions.restoreOriginalOptions()

  bench.timeEnd('launch:init')

  bench.time('launch:require:lib/cypress')
  const cy = require('./lib/cypress')

  bench.timeEnd('launch:require:lib/cypress')

  bench.time('launch:start')
  module.exports = cy.start(process.argv)

  bench.timeEnd('launch:start')
}

launchOrFork()
