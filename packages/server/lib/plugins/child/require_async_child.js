process.title = 'Cypress: Config Manager'

const { telemetry } = require('@packages/telemetry')

const { file, projectRoot, telemetryCtx } = require('minimist')(process.argv.slice(2))

let context = {}

if (telemetryCtx) {
  context = JSON.parse(
    Buffer.from(telemetryCtx, 'base64').toString('utf-8'),
  )
}

telemetry.init({ namespace: 'cypress:child:process', context }).finally(() => {
  const span = telemetry.startSpan({ name: 'child:process', active: true })

  require('../../util/suppress_warnings').suppress()

  process.on('disconnect', async () => {
    span?.end()

    await telemetry.forceFlush()
    process.exit()
  })

  require('graceful-fs').gracefulify(require('fs'))
  const util = require('../util')
  const ipc = util.wrapIpc(process)
  const run = require('./run_require_async_child')

  run(ipc, file, projectRoot)
})
