process.title = 'Cypress: Config Manager'

const { telemetry, OTLPTraceExporterIpc } = require('@packages/telemetry')

const { file, projectRoot, telemetryCtx } = require('minimist')(process.argv.slice(2))

let context
let version

if (telemetryCtx) {
  const ctx = JSON.parse(
    Buffer.from(telemetryCtx, 'base64').toString('utf-8'),
  )

  context = ctx.context
  version = ctx.version
}

const exporter = new OTLPTraceExporterIpc()

telemetry.init({ namespace: 'cypress:child:process', context, version, exporter })
const span = telemetry.startSpan({ name: 'child:process', active: true })

require('../../util/suppress_warnings').suppress()

process.on('disconnect', async () => {
  process.exit()
})

require('graceful-fs').gracefulify(require('fs'))
const util = require('../util')
const ipc = util.wrapIpc(process)
const run = require('./run_require_async_child')

exporter.attachIPC(ipc)

ipc.on('main:process:will:disconnect', async () => {
  if (span) {
    span.end()
  }

  await telemetry.forceFlush()
  ipc.send('main:process:will:disconnect:ack')
})

run(ipc, file, projectRoot)
