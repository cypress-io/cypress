require('graceful-fs').gracefulify(require('fs'))

require('../../util/suppress_unauthorized_warning').suppress()

const ipc = require('../util').wrapIpc(process)
const { file: pluginsFile, projectRoot } = require('minimist')(process.argv.slice(2))

require('./run_plugins')(ipc, pluginsFile, projectRoot)
