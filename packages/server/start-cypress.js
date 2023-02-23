const { telemetry } = require('@packages/telemetry')

const init = async () => {
  const electronApp = require('./lib/util/electron-app')

  // are we in the main node process or the electron process?
  const isRunningElectron = electronApp.isRunning()

  const packageRoot = require('@packages/root')

  if (electronApp.isRunning()) {
    await telemetry.init({ namespace: 'cypress:server', packageRoot })
    const { debugElapsedTime } = require('./lib/util/performance_benchmark')

    const bootstrapTime = debugElapsedTime('bootstrap-time')

    const span = telemetry.startSpan({ name: 'server', attachType: 'root', active: true })

    telemetry.startSpan({ name: 'startup:time' })

    span?.setAttribute('bootstrap-time', bootstrapTime)
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
}

init()
