process.env.UV_THREADPOOL_SIZE = 128
require('graceful-fs').gracefulify(require('fs'))
if (process.env.CYPRESS_ENV !== 'production') {
  require("@packages/ts/register")
  // else in production mode all TypeScript has been
  // transpiled into JavaScript
  // also conditional on coffee, otherwise fails in the packaged Electron app
  require("@packages/coffee/register")
}
require && require.extensions && delete require.extensions[".litcoffee"]
require && require.extensions && delete require.extensions[".coffee.md"]
require("./lib/cypress").start(process.argv)
