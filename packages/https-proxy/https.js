const Promise = require('bluebird')
const proxy = require('./test/helpers/proxy')
const httpServer = require('./test/helpers/http_server')
const httpsServer = require('./test/helpers/https_server')

Promise.join(
  httpServer.start(8888),

  httpsServer.start(8444),
  httpsServer.start(8445),

  proxy.start(3333),
)
