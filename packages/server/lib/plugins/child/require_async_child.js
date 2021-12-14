process.title = 'Cypress: Config Manager'

require('graceful-fs').gracefulify(require('fs'))
const util = require('../util')
const ipc = util.wrapIpc(process)
const run = require('./run_require_async_child')

require('../../util/suppress_warnings').suppress()

const { file, projectRoot } = require('minimist')(process.argv.slice(2))

run(ipc, file, projectRoot)
