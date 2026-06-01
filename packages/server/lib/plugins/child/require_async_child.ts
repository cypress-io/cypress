process.title = 'Cypress: Config Manager'

import os from 'os'
import pDefer from 'p-defer'
import Debug from 'debug'
import { telemetry, OTLPTraceExporterIpc, decodeTelemetryContext } from '@packages/telemetry'
import minimist from 'minimist'
import fs from 'fs'
import * as util from '../util'
import { gracefulify } from 'graceful-fs'
import { suppress as suppressWarnings } from '../../util/suppress_warnings'
import { run as runRequireAsyncChild } from './run_require_async_child'

const debug = Debug('cypress:lifecycle:require_async_child')

const argv = minimist(process.argv.slice(2))
const file = argv.file as string
const projectRoot = argv.projectRoot as string
const telemetryCtx = argv.telemetryCtx as string | undefined

debug('initializing telemetry')

const { context, version } = decodeTelemetryContext(telemetryCtx ?? '')

const exporter = new OTLPTraceExporterIpc()

if (version && context) {
  telemetry.init({ namespace: 'cypress:child:process', context, version, exporter })
}

const span = telemetry.startSpan({ name: 'child:process', active: true })

debug('child:process span initialized')
suppressWarnings()

gracefulify(fs)
const ipc = util.wrapIpc(process as unknown as util.WrappedIpcProcess)

exporter.attachIPC(ipc)

let disconnection: Promise<void> | null = null
const willDisconnect = pDefer<void>()

process.on('disconnect', async () => {
  try {
    debug('received disconnect event')
    willDisconnect.resolve()
    await Promise.resolve() // allow for diconnect teardown to complete, if in process
  } finally {
    process.exit()
  }
})

debug('registering main:process:will:disconnect listener')
ipc.on('main:process:will:disconnect', async () => {
  debug('received main:process:will:disconnect')
  if (span) {
    debug('ending span')
    span.end()
  }

  debug('existing disconnection?', disconnection)
  debug('waiting telemetry shutdown')
  const p = disconnection ?? (disconnection = telemetry.shutdown())

  await p
  debug('telemetry shutdown complete')

  debug('sending main:process:will:disconnect:ack')
  ipc.send('main:process:will:disconnect:ack')
  willDisconnect.resolve()
})

;['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, async () => {
    debug('received signal', signal)
    await Promise.race([
      willDisconnect.promise,
      new Promise<void>((resolve) => {
        setTimeout(() => {
          debug('timeout waiting for main:process:will:disconnect signal')
          resolve()
        }, 5000)
      }),
    ])

    process.exit(128 + os.constants.signals[signal])
  })
})

debug('run')
runRequireAsyncChild(ipc, file, projectRoot)
debug('run complete')
