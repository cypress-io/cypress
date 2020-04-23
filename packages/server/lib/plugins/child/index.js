require('graceful-fs').gracefulify(require('fs'))
require('@packages/coffee/register')
require && require.extensions && delete require.extensions['.litcoffee']
require && require.extensions && delete require.extensions['.coffee.md']

const ipc = require('../util').wrapIpc(process)
const { file: pluginsFile, projectRoot } = require('minimist')(process.argv.slice(2))

require('./run_plugins')(ipc, pluginsFile, projectRoot)
