/* global $Cypress, io */

import _ from 'lodash'
import { EventEmitter } from 'events'

import overrides from './overrides'

// TODO: loadModules should be default true
const driver = $Cypress.create({ loadModules: true })
const channel = io.connect({ path: '/__socket.io' })

const socketEvents = 'run:start run:end suite:start suite:end hook:start hook:end test:start test:end'.split(' ')
const runnerEvents = 'viewport config stop url:changed page:loading'.split(' ')

const eventBus = new EventEmitter()

export default {
  start () {
    // eventBus.removeAllListeners()
    // driver.off()

    overrides.overloadMochaRunnerUncaught()

    driver.setConfig({})

    driver.start()

    _.each(socketEvents, (event) => {
      driver.on(event, (...args) => channel.emit(event, ...args))
    })

    _.each(runnerEvents, (event) => {
      driver.on(event, (...args) => eventBus.emit(event, ...args))
    })

    // hacks to simply force a response to automation
    // requests so our tests run
    driver.on('get:cookies', (options, cb) => {
      // channel.emit('get:cookies', cb)
      cb({ response: [] })
    })

    driver.on('clear:cookies', (options, cb) => {
      cb({ response: [] })
    })
  },

  run (specWindow, $autIframe) {
    driver.initialize(specWindow, $autIframe)

    driver.run(() => {})
  },

  on (event, ...args) {
    eventBus.on(event, ...args)
  },

  eventBus
}
