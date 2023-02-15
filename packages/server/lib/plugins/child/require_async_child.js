import process from 'node:process'

process.title = 'Cypress: Config Manager'

const { telemetry } = require('@packages/telemetry/dist/node')

const { file, projectRoot, telemetryCtx } = require('minimist')(process.argv.slice(2))

const context = JSON.parse(
  Buffer.from(telemetryCtx, 'base64').toString('utf-8'),
)

telemetry.init({ prefix: 'cypress:child:process', context })

const span = telemetry.startSpan('inside')

span.end()

// process.on('beforeExit', (code) => {
//   console.log('child process before exit')
//   span.end()
// })

require('../../util/suppress_warnings').suppress()

process.on('disconnect', () => {
  process.exit()
})

require('graceful-fs').gracefulify(require('fs'))
const util = require('../util')
const ipc = util.wrapIpc(process)
const run = require('./run_require_async_child')

run(ipc, file, projectRoot)
