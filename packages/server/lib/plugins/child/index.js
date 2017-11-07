// if we are running in electron
// we must hack around busted timers
if (process.versions.electron) {
  require('../../timers/parent').fix()
}
require('graceful-fs').gracefulify(require('fs'))
require('@packages/coffee/register')
require && require.extensions && delete require.extensions['.litcoffee']
require && require.extensions && delete require.extensions['.coffee.md']

const ipc = require('../util').wrapIpc(process)
const pluginsFile = require('minimist')(process.argv.slice(2)).file

require('./run_plugins')(ipc, pluginsFile)
