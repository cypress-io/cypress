process.title = 'Cypress: Config Manager'

const v8 = require('node:v8')

console.log(process.env.NODE_OPTIONS) // eslint-disable-line no-console
console.log(v8.getHeapStatistics()) // eslint-disable-line no-console

require('../../util/suppress_warnings').suppress()

process.on('disconnect', () => {
  process.exit()
})

require('graceful-fs').gracefulify(require('fs'))
const util = require('../util')
const ipc = util.wrapIpc(process)
const run = require('./run_require_async_child')

const { file, projectRoot } = require('minimist')(process.argv.slice(2))

run(ipc, file, projectRoot)
