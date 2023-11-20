const electronApp = require('./lib/util/electron-app')
const { telemetry, OTLPTraceExporterCloud } = require('@packages/telemetry')
const { apiRoutes } = require('./lib/cloud/routes')
const encryption = require('./lib/cloud/encryption')

// are we in the main node process or the electron process?
const isRunningElectron = electronApp.isRunning()

const pkg = require('@packages/root')

if (isRunningElectron) {
  // To pass unencrypted telemetry data to an independent open telemetry endpoint,
  // disable the encryption header, update the url, and add any other required headers.
  // For example:
  // const exporter = new OTLPTraceExporterCloud({
  //   url: 'https://api.honeycomb.io/v1/traces',
  //   headers: {
  //     'x-honeycomb-team': 'key',
  //   },
  // })
  // See additional information here: https://github.com/cypress-io/cypress/blob/develop/packages/telemetry/README.md#otlptraceexportercloud
  const exporter = new OTLPTraceExporterCloud({
    url: apiRoutes.telemetry(),
    encryption,
  })

  telemetry.init({
    namespace: 'cypress:server',
    version: pkg.version,
    exporter,
  })

  const { debugElapsedTime } = require('./lib/util/performance_benchmark')

  const v8SnapshotStartupTime = debugElapsedTime('v8-snapshot-startup-time')
  const endTime = v8SnapshotStartupTime + global.cypressServerStartTime

  telemetry.startSpan({ name: 'cypress', attachType: 'root', active: true, opts: { startTime: global.cypressBinaryStartTime } })

  const v8SnapshotSpan = telemetry.startSpan({ name: 'v8snapshot:startup', opts: { startTime: global.cypressServerStartTime } })

  v8SnapshotSpan?.end(endTime)

  telemetry.startSpan({ name: 'binary:startup' })
}

const { patchFs } = require('./lib/util/patch-fs')
const fs = require('fs')

// prevent EMFILE errors
patchFs(fs)

// override tty if we're being forced to
require('./lib/util/tty').override()

if (process.env.CY_NET_PROFILE && isRunningElectron) {
  const netProfiler = require('./lib/util/net_profiler')()

  process.stdout.write(`Network profiler writing to ${netProfiler.logPath}\n`)
}

require('./lib/unhandled_exceptions').handle()

process.env.UV_THREADPOOL_SIZE = 128

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

require('./lib/util/suppress_warnings').suppress()

module.exports = require('./lib/cypress').start(process.argv)
