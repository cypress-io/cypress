const EE = require('events')
const util = require('../util')

const wrap = (ipc, invoke, ids, args) => {
  const [options] = args
  const devServerEvents = new EE()

  ipc.on('dev-server:specs:changed', (specs) => {
    devServerEvents.emit('dev-server:specs:changed', specs)
  })

  devServerEvents.on('dev-server:compile:success', ({ specFile } = {}) => {
    ipc.send('dev-server:compile:success', { specFile })
  })

  options.devServerEvents = devServerEvents

  util.wrapChildPromise(ipc, invoke, ids, args)
}

module.exports = { wrap }
