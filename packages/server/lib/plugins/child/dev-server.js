const EE = require('events')
const util = require('../util')

const wrap = (ipc, invoke, ids, [options]) => {
  const devServerEvents = new EE()

  ipc.on('dev-server:specs:changed', (specs) => {
    devServerEvents.emit('dev-server:specs:changed', specs)
  })

  options.devServerEvents = devServerEvents

  util.wrapChildPromise(ipc, invoke, ids, [options])
}

module.exports = { wrap }
