require('../cwd')

const EE = require('events')
const debug = require('debug')('cypress:ct:dev-server')
const plugins = require('../plugins')

const baseEmitter = new EE()

let allowToRequest = false

plugins.registerHandler((ipc) => {
  baseEmitter.on('dev-server:specs:changed', (specs) => {
    ipc.send('dev-server:specs:changed', specs)
  })

  ipc.on('dev-server:compile:error', (error) => {
    baseEmitter.emit('dev-server:compile:error', error)
  })

  ipc.on('dev-server:compile:success', () => {
    allowToRequest = true,
    baseEmitter.emit('dev-server:compile:success')
  })

  return baseEmitter.on('dev-server:close', () => {
    debug('base emitter plugin close event')

    return ipc.send('dev-server:close')
  })
})

// for simpler stubbing from unit tests
const API = {
  emitter: baseEmitter,
  allowToRequest,

  start ({ specs, config }) {
    return plugins.execute('dev-server:start', { specs, config })
  },

  updateSpecs (specs) {
    return baseEmitter.emit('dev-server:specs:changed', specs)
  },

  close () {
    debug('close dev-server')
    baseEmitter.emit('close')

    return baseEmitter.removeAllListeners()
  },
}

module.exports = API
