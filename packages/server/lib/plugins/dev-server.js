require('../cwd')

const EE = require('events')
const debug = require('debug')('cypress:ct:dev-server')
const plugins = require('../plugins')
const errors = require('../errors')

const baseEmitter = new EE()
let isDevServerReadyPromiseResolver
// give the dev server up to 30 seconds to compile. Otherwise reject the promise and fail before launching the browser
const isDevServerReadyPromise = new Promise((resolve, reject) => {
  isDevServerReadyPromiseResolver = resolve
})

plugins.registerHandler((ipc) => {
  baseEmitter.on('dev-server:specs:changed', (specs) => {
    ipc.send('dev-server:specs:changed', specs)
  })

  ipc.on('dev-server:compile:success', ({ specFile } = {}) => {
    baseEmitter.emit('dev-server:compile:success', { specFile })
  })

  baseEmitter.on('dev-server:compile:success', () => {
    isDevServerReadyPromiseResolver()
  })
})

// for simpler stubbing from unit tests
const API = {
  emitter: baseEmitter,
  asyncIsDevServerReady: isDevServerReadyPromise,
  isDevServerReadyPromiseResolver,

  start ({ specs, config }) {
    if (!plugins.has('dev-server:start')) {
      throw errors.get('CONFIG_FILE_INVALID_DEV_START_EVENT', config.pluginsFile)
    }

    return plugins.execute('dev-server:start', { specs, config })
  },

  updateSpecs (specs) {
    baseEmitter.emit('dev-server:specs:changed', specs)
  },

  close () {
    debug('close dev-server')
    baseEmitter.removeAllListeners()
  },
}

module.exports = API
