import Debug from 'debug'
import { isRunning as isElectronRunning } from './lib/util/electron-app'
import { telemetry, OTLPTraceExporterCloud } from '@packages/telemetry'
import { apiRoutes } from './lib/cloud/routes'
import * as encryption from './lib/cloud/encryption'
import { override as overrideTty } from './lib/util/tty'
import { GracefulExit } from './lib/util/graceful-exit'
import { NetProfiler } from './lib/util/net_profiler'
import { debugElapsedTime } from './lib/util/performance_benchmark'
import { suppress } from './lib/util/suppress_warnings'
import * as processProfiler from './lib/util/process_profiler'
import * as unhandledExceptions from './lib/unhandled_exceptions'
import cypress from './lib/cypress'
import pkg from '@packages/root'
import { patchFs } from './lib/util/patch-fs'
import fs from 'fs'
import { appendElectronSwitches } from './lib/append_electron_switches'

declare global {
  namespace NodeJS {
    interface Process {
      enablePromiseAPIs?: boolean
    }
  }
}

const debug = Debug('cypress:server:start-cypress')

export const run = async () => {
  // are we in the main node process or the electron process?
  const isRunningElectron = isElectronRunning()

  if (isRunningElectron) {
    // if we are in the electron process, we need to patch the electron switches before Cypress launches the app
    // @see https://www.electronjs.org/docs/latest/api/environment-variables#electron_run_as_node
    const { app } = await import('electron')

    appendElectronSwitches(app)

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
      encryption: encryption as unknown as {
        encryptRequest: (requestOptions: {
          url: string
          method: string
          body: string
        }) => Promise<{ jwe: string }>
      },
    })

    telemetry.init({
      namespace: 'cypress:server',
      version: pkg.version,
      exporter,
    })

    const v8SnapshotStartupTime = debugElapsedTime('v8-snapshot-startup-time')
    const serverStartTime = global.cypressServerStartTime ?? NaN
    const endTime = v8SnapshotStartupTime + serverStartTime

    telemetry.startSpan({ name: 'cypress', attachType: 'root', active: true, opts: { startTime: global.cypressBinaryStartTime } })

    GracefulExit.addStep(async (code) => {
      try {
        const span = telemetry.getSpan('cypress')

        span?.setAttribute('exitCode', code)
        span?.end()
      } catch (error) {
        debug('Error during cleanup of telemetry span on exit: %o', error)
      }

      try {
        await telemetry.shutdown()
      } catch (error) {
        debug('Error during telemetry shutdown on exit: %o', error)
      }
    }, 'finalize telemetry')

    const v8SnapshotSpan = telemetry.startSpan({ name: 'v8snapshot:startup', opts: { startTime: serverStartTime } })

    v8SnapshotSpan?.end(endTime)

    telemetry.startSpan({ name: 'binary:startup' })
  }

  // prevent EMFILE errors
  patchFs(fs)

  // override tty if we're being forced to
  overrideTty()

  if (process.env.CY_NET_PROFILE && isRunningElectron) {
    const netProfiler = new NetProfiler()

    process.stdout.write(`Network profiler writing to ${netProfiler.logPath}\n`)
  }

  unhandledExceptions.handle()

  process.env.UV_THREADPOOL_SIZE = '128'

  if (isRunningElectron) {
    processProfiler.start()
  }

  // warn when deprecated callback apis are used in electron
  // https://github.com/electron/electron/blob/master/docs/api/process.md#processenablepromiseapis
  process.enablePromiseAPIs = process.env.CYPRESS_INTERNAL_ENV !== 'production'

  // don't show any electron deprecation warnings in prod
  process.noDeprecation = process.env.CYPRESS_INTERNAL_ENV === 'production'

  // always show stack traces for Electron deprecation warnings
  process.traceDeprecation = true

  suppress()

  cypress.start(process.argv)
}
