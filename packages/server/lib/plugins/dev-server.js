require('../cwd')

const EE = require('events')
const debug = require('debug')('cypress:ct:dev-server')
const plugins = require('../plugins')
const errors = require('../errors')
// HERE
const baseEmitter = new EE()

plugins.registerHandler((ipc) => {
  baseEmitter.on('dev-server:specs:changed', (specs) => {
    // ipc emitter
    ipc.send('dev-server:specs:changed', specs)
  })

  // baseEmitter.on('dev-server:close', (specs) => {
  //   debugger
  //   // ipc emitter
  //   ipc.once('dev-server:closed', () => {
  //     debugger
  //     baseEmitter.on('dev-server:closed')
  //   })

  //   debugger
  //   ipc.send('dev-server:close', specs)
  // })

  ipc.on('dev-server:compile:success', ({ specFile } = {}) => {
    baseEmitter.emit('dev-server:compile:success', { specFile })
  })

  baseEmitter.on('dev-server:stop', () => {
    console.log('sending dev server stop')
    ipc.send('dev-server:stop')
  })

  ipc.on('dev-server:stopped', () => {
    debugger
    console.log('stopped from ipc, broadcasting to baseEmitter')
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

    return plugins.execute('dev-server:start', { specs, config })
  },

  updateSpecs (specs) {
    baseEmitter.emit('dev-server:specs:changed', specs)
  },

  close () {
    debug('close dev-server')
    baseEmitter.removeAllListeners()
  },

  closeExperimental () {
    // if (!plugins.has('dev-server:stop')) {
    //   throw 'foobar'
    // }

    //  console.log('plugin is defined')

    return new Promise((resolve, reject) => {
      baseEmitter.once('dev-server:stopped', () => {
        console.log('stopped... resolving')

        debugger
        resolve()
      })

      console.log('execute stop')

      baseEmitter.emit('dev-server:stop')
      // plugins.execute('dev-server:stop')
    })
  },

  // closeExperimental () {
  //   return new Promise((resolve, reject) => {
  //     baseEmitter.once('dev-server:closed', () => {
  //       debugger
  //       resolve()
  //     })

  //     debugger
  //     baseEmitter.emit('dev-server:close')
  //   })
  //   // we need to actually send an ack to close the dev server if the experimental flag is configured
  // },
}

module.exports = API
