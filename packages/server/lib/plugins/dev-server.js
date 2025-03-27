require('../cwd')

const EE = require('events')
const debug = require('debug')('cypress:ct:dev-server')
const plugins = require('../plugins')
const errors = require('../errors')

const baseEmitter = new EE()

plugins.registerHandler((ipc) => {
  baseEmitter.on('dev-server:specs:changed', (specsAndOptions) => {
    ipc.send('dev-server:specs:changed', specsAndOptions)
  })

  ipc.on('dev-server:compile:success', ({ specFile } = {}) => {
    baseEmitter.emit('dev-server:compile:success', { specFile })
  })
})

// for simpler stubbing from unit tests
const API = {
  emitter: baseEmitter,

  start ({ specs, config }) {
    if (!plugins.has('dev-server:start')) {
      throw errors.get('CONFIG_FILE_INVALID_DEV_START_EVENT', config.pluginsFile)
    }

    return plugins.execute('dev-server:start', { specs, config })
  },

  updateSpecs (specs, options) {
    baseEmitter.emit('dev-server:specs:changed', { specs, options })
  },

  close () {
    debug('close dev-server')
    baseEmitter.removeAllListeners()
  },
}

module.exports = API
