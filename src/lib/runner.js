/* global $Cypress, io */

import _ from 'lodash'
import { EventEmitter } from 'events'

import overrides from './overrides'

// TODO: loadModules should be default true
const driver = $Cypress.create({ loadModules: true })
const channel = io.connect({ path: '/__socket.io' })

const socketEvents = 'run:start run:end suite:start suite:end hook:start hook:end test:start test:end fixture request history:entries exec'.split(' ')
const automationEvents = 'get:cookies get:cookie set:cookie clear:cookies clear:cookie'.split(' ')
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

    _.each(automationEvents, (event) => {
      driver.on(event, (...args) => channel.emit('automation:request', event, ...args))
    })

    driver.on('message', (msg, data, cb) => {
      channel.emit('client:request', msg, data, cb)
    })

    _.each(runnerEvents, (event) => {
      driver.on(event, (...args) => eventBus.emit(event, ...args))
    })
    driver.on('fail', console.error.bind(console))
  },

  run (specWindow, $autIframe) {
    driver.initialize(specWindow, $autIframe)

    driver.run(() => {})
  },

  on (event, ...args) {
    eventBus.on(event, ...args)
  },
}
