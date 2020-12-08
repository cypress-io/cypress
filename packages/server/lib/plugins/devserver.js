require('../cwd')

const _ = require('lodash')
const EE = require('events')
const path = require('path')
const debug = require('debug')('cypress:ct:devserver')
const plugins = require('../plugins')

const baseEmitter = new EE()

plugins.registerHandler((ipc) => {
  baseEmitter.on('devserver:specs:changed', (specs) => {
    ipc.send('devserver:specs:changed', specs)
  })

  return baseEmitter.on('devserver:close', () => {
    debug('base emitter plugin close event')

    return ipc.send('devserver:close')
  })
})

// for simpler stubbing from unit tests
const API = {
  emitter: baseEmitter,

  start ({ specs, config }) {
    return plugins.execute('devserver:config', { specs, config })
  },

  updateSpecs (specs) {
    return baseEmitter.emit('devserver:specs:changed', specs)
  },

  close () {
    debug('close devserver')
    baseEmitter.emit('close')

    return baseEmitter.removeAllListeners()
  },
}

module.exports = API
