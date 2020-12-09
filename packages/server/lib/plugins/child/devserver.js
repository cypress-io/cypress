const util = require('../util')
const EE = require('events')
const { start: startWebpackDevServer } = require('@packages/webpack-ct')

const wrap = (ipc, invoke, ids, [arg]) => {
  const { specs, config } = arg
  const devserverEvents = new EE()

  ipc.on('devserver:specs:changed', (specs) => {
    devserverEvents.emit('devserver:specs:changed', specs)
  })

  const devserverConfig = {
    support: '', // file path
    files: specs, // { { path: f.path, absolute: path.resolve(f.path) }
    projectRoot: config.projectRoot, // file path
    devserverEvents,
  }

  util.wrapChildPromise(ipc, invoke, ids, [], async (webpackConfig) => {
    const webpackDevServer = await startWebpackDevServer(webpackConfig, devserverConfig)

    return new Promise((resolve) => {
      const httpSvr = webpackDevServer.listen(0, '127.0.0.1', () => {
        resolve(httpSvr.address().port)
      })
    })
  })
}

module.exports = {
  wrap,
}
