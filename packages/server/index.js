// override tty if we're being forced to
require('./lib/util/tty').override()

// if we are running in electron
// we must hack around busted timers
if (process.versions.electron) {
  require('./timers/parent').fix()
}

process.env.UV_THREADPOOL_SIZE = 128
require('graceful-fs').gracefulify(require('fs'))
// if running in production mode (CYPRESS_ENV)
// all transpile should have been done already
// and these calls should do nothing
require('@packages/ts/register')
require('@packages/coffee/register')

require && require.extensions && delete require.extensions['.litcoffee']
require && require.extensions && delete require.extensions['.coffee.md']

module.exports = require('./lib/cypress').start(process.argv)
