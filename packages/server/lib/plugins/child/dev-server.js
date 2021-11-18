const EE = require('events')
const util = require('../util')

const wrap = (ipc, invoke, ids, [options]) => {
  const devServerEvents = new EE()

  ipc.on('dev-server:specs:changed', (specs) => {
    devServerEvents.emit('dev-server:specs:changed', specs)
  })

  devServerEvents.on('dev-server:compile:error', (error) => {
    ipc.send('dev-server:compile:error', error)
  })

  devServerEvents.on('dev-server:compile:success', ({ specFile } = {}) => {
    ipc.send('dev-server:compile:success', { specFile })
  })

  options.devServerEvents = devServerEvents

  util.wrapChildPromise(ipc, invoke, ids, [options])
}

module.exports = { wrap }
