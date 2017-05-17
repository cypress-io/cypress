process.env.UV_THREADPOOL_SIZE = 128
require('graceful-fs').gracefulify(require('fs'))
require("../ts/register")
require("../coffee/register")
require && require.extensions && delete require.extensions[".litcoffee"]
require && require.extensions && delete require.extensions[".coffee.md"]
require("./lib/cypress").start(process.argv)
