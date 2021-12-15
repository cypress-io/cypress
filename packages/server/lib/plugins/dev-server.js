require('../cwd')

const EE = require('events')
const debug = require('debug')('cypress:ct:dev-server')
const plugins = require('../plugins')
const errors = require('../errors')

const baseEmitter = new EE()

plugins.registerHandler((ipc) => {
  baseEmitter.on('dev-server:specs:changed', (specs) => {
    ipc.send('dev-server:specs:changed', specs)
  })

  ipc.on('dev-server:compile:error', (error) => {
    baseEmitter.emit('dev-server:compile:error', error)
  })

  ipc.on('dev-server:compile:success', ({ specFile } = {}) => {
    baseEmitter.emit('dev-server:compile:success', { specFile })
  })

  baseEmitter.on('dev-server:close', () => {
    debug('base emitter plugin close event')

    ipc.send('dev-server:close')
  })
})

// for simpler stubbing from unit tests
const API = {
  emitter: baseEmitter,

  start ({ specs, config }) {
    if (!plugins.has('dev-server:start')) {
      throw errors.get('CT_NO_DEV_START_EVENT', config.pluginsFile)
    }

    return plugins.execute('dev-server:start', { specs, config })
  },

  updateSpecs (specs) {
    baseEmitter.emit('dev-server:specs:changed', specs)
  },

  close () {
    debug('close dev-server')
    baseEmitter.emit('close')

    baseEmitter.removeAllListeners()
  },
}

module.exports = API
