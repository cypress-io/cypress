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

const localBus = new EventEmitter()

export default {
  start (config) {
    // localBus.removeAllListeners()
    // driver.off()

    overrides.overloadMochaRunnerUncaught()

    driver.setConfig(_.pick(config, 'waitForAnimations', 'animationDistanceThreshold', 'commandTimeout', 'pageLoadTimeout', 'requestTimeout', 'responseTimeout', 'environmentVariables', 'xhrUrl', 'baseUrl', 'viewportWidth', 'viewportHeight', 'execTimeout'))

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
      driver.on(event, (...args) => localBus.emit(event, ...args))
    })

    driver.on('fail', (error) => {
      console.error('Failure:', error)
    })
  },

  run (specWindow, $autIframe) {
    driver.initialize(specWindow, $autIframe)

    driver.run((error, results) => {
      console.log('Tests finished')
      if (error) console.error('Error:', error)
      if (results) console.log('Results:', results)
    })
  },

  on (event, ...args) {
    localBus.on(event, ...args)
  },
}
