require('../cwd')

const EE = require('events')
const debug = require('debug')('cypress:ct:dev-server')
const plugins = require('../plugins')
const errors = require('../errors')

const baseEmitter = new EE()
// used for experimentalJITComponentTesting for CT to keep track of whether there is an active dev server instance or not
let hasActiveDevServer = false

plugins.registerHandler((ipc) => {
  baseEmitter.on('dev-server:specs:changed', (specs) => {
    ipc.send('dev-server:specs:changed', specs)
  })

  ipc.on('dev-server:compile:success', ({ specFile } = {}) => {
    baseEmitter.emit('dev-server:compile:success', { specFile })
  })

  baseEmitter.on('dev-server:stop', () => {
    debug('baseEmitter: dev-server:stop')
    ipc.send('dev-server:stop')
  })

  ipc.on('dev-server:stopped', () => {
    debug('ipc: dev-server:stopped')
    baseEmitter.emit('dev-server:stopped')
  })
})

// for simpler stubbing from unit tests
const API = {
  emitter: baseEmitter,

  start ({ specs, config }) {
    if (!plugins.has('dev-server:start')) {
      throw errors.get('CONFIG_FILE_INVALID_DEV_START_EVENT', config.pluginsFile)
    }

    if (!hasActiveDevServer) {
      hasActiveDevServer = true

      return plugins.execute('dev-server:start', { specs, config })
    }
  },

  updateSpecs (specs) {
    baseEmitter.emit('dev-server:specs:changed', specs)
  },

  close () {
    debug('close dev-server')
    hasActiveDevServer = false
    baseEmitter.removeAllListeners()
  },

  stop () {
    if (!hasActiveDevServer) {
      return
    }

    return new Promise((resolve, reject) => {
      baseEmitter.once('dev-server:stopped', () => {
        debug('baseEmitter: dev-server:stopped')
        hasActiveDevServer = false
        resolve()
      })

      baseEmitter.emit('dev-server:stop')
    })
  },
}

module.exports = API
