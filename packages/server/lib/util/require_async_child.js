require('graceful-fs').gracefulify(require('fs'))
const util = require('../plugins/util')
const ipc = util.wrapIpc(process)
const run = require('./run_require_async_child')

require('./suppress_warnings').suppress()

const { file, projectRoot } = require('minimist')(process.argv.slice(2))

run(ipc, file, projectRoot)
