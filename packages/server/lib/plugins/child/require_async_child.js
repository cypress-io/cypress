process.title = 'Cypress: Config Manager'
const os = require('os')
const pDefer = require('p-defer')
const Debug = require('debug')
const debug = Debug('cypress:lifecycle:require_async_child')

const { telemetry, OTLPTraceExporterIpc, decodeTelemetryContext } = require('@packages/telemetry')

const { file, projectRoot, telemetryCtx } = require('minimist')(process.argv.slice(2))

debug('initializing telemetry')

const { context, version } = decodeTelemetryContext(telemetryCtx)

const exporter = new OTLPTraceExporterIpc()

if (version && context) {
  telemetry.init({ namespace: 'cypress:child:process', context, version, exporter })
}

const span = telemetry.startSpan({ name: 'child:process', active: true })

debug('child:process span initialized')
require('../../util/suppress_warnings').suppress()

require('graceful-fs').gracefulify(require('fs'))
const util = require('../util')
const ipc = util.wrapIpc(process)

exporter.attachIPC(ipc)

let disconnection = null
let willDisconnect = pDefer()

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
      new Promise((resolve) => {
        setTimeout(() => {
          debug('timeout waiting for main:process:will:disconnect signal')
          resolve()
        }, 5000)
      }),
    ])

    process.exit(128 + os.constants.signals[signal])
  })
})

const run = require('./run_require_async_child')

debug('run')
run(ipc, file, projectRoot)
debug('run complete')
