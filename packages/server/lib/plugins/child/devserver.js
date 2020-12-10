const EE = require('events')
const util = require('../util')

const wrap = (ipc, invoke, ids, [options]) => {
  const devserverEvents = new EE()

  ipc.on('devserver:specs:changed', (specs) => {
    devserverEvents.emit('devserver:specs:changed', specs)
  })

  options.devserverEvents = devserverEvents

  util.wrapChildPromise(ipc, invoke, ids, [options])
}

module.exports = { wrap }
