require('graceful-fs').gracefulify(require('fs'))

require('../../util/suppress_warnings').suppress()

const ipc = require('../util').wrapIpc(process)
const { file: pluginsFile, projectRoot, testingType } = require('minimist')(process.argv.slice(2))

require('./run_plugins')(ipc, pluginsFile, projectRoot, testingType)
