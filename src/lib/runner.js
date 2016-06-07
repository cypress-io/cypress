/* global $, $Cypress, io */

import _ from 'lodash'
import { EventEmitter } from 'events'
import Promise from 'bluebird'

import logs from './logs'
import tests from './tests'
import overrides from './overrides'

// TODO: loadModules should be default true
const driver = $Cypress.create({ loadModules: true })
const channel = window.channel = io.connect({ path: '/__socket.io' })

channel.on('connect', () => {
  channel.emit('runner:connected')
})

const socketEvents = 'run:start run:end fixture request history:entries exec domain:change'.split(' ')
const testEvents = 'test:before:hooks test:after:hooks'.split(' ')
const automationEvents = 'get:cookies get:cookie set:cookie clear:cookies clear:cookie'.split(' ')
const runnerEvents = 'viewport config stop url:changed page:loading'.split(' ')

const localBus = new EventEmitter()

export default {
  ensureAutomation (connectionInfo) {
    return new Promise((resolve) => {
      channel.emit('is:automation:connected', connectionInfo, resolve)
    })
  },

  start (config, specSrc) {
    // localBus.removeAllListeners()
    // driver.off()

    overrides.overloadMochaRunnerUncaught()

    driver.setConfig(_.pick(config, 'waitForAnimations', 'animationDistanceThreshold', 'commandTimeout', 'pageLoadTimeout', 'requestTimeout', 'responseTimeout', 'environmentVariables', 'xhrUrl', 'baseUrl', 'viewportWidth', 'viewportHeight', 'execTimeout'))

    driver.start()

    channel.emit('watch:test:file', specSrc)

    driver.on('initialized', ({ runner }) => {
      channel.emit('runnables:ready', runner.getNormalizedRunnables())
    })

    driver.on('log', (log) => {
      logs.add(log)
      channel.emit('reporter:log:add', log.toJSON(), (row) => {
        log.set('row', row)

        // render it calling onRender
      })

      log.on('state:changed', () => {
        channel.emit('reporter:log:state:changed', log.toJSON())
      })
    })

    channel.on('runner:console:error', (testId) => {
      let test = tests.get(testId)
      if (test) {
        this._logError(test.err.stack)
      } else {
        this._logError('No error found for test id', testId)
      }
    })

    channel.on('runner:console:log', (logId) => {
      let log = logs.get(logId)
      if (log) {
        console.log('log', log)
        // log using reporter entities command.coffee logBlahBlah
      } else {
        this._logError('No log found for log id', logId)
      }
    })

    _.each(testEvents, (event) => {
      driver.on(event, (test) => {
        tests.add(test)

        if (test.err) {
          test = _.extend({}, test, { err: test.err.toString() })
        }
        channel.emit(event, test)
      })
    })

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

    channel.on('watched:file:changed', () => {
      this._reRun()
    })

    // when we actually unload then
    // nuke all of the cookies again
    // so we clear out unload
    $(window).on('unload', () => {
      this._clearAllCookies()
    })

    // when our window triggers beforeunload
    // we know we've change the URL and we need
    // to clear our cookies
    // additionally we set unload to true so
    // that Cypress knows not to set any more
    // cookies
    $(window).on('beforeunload', () => {
      channel.emit('restart:test:run')
      this._clearAllCookies()
      this._setUnload()
    })
  },

  run (specWindow, $autIframe) {
    driver.initialize(specWindow, $autIframe)
    driver.run(() => {})
  },

  _reRun () {
    // when we are re-running we first
    // need to abort cypress always
    Promise.join(
      driver.abort(),
      this._restart()
    )
    .then(() => {
      logs.reset()
      localBus.emit('restart')
    })
  },

  _restart () {
    return new Promise((resolve) => {
      channel.once('reporter:restarted', resolve)
      channel.emit('reporter:restart:test:run')
    })
  },

  on (event, ...args) {
    localBus.on(event, ...args)
  },

  // clear all the cypress specific cookies
  // whenever our app starts
  // and additional when we stop running our tests
  _clearAllCookies () {
    $Cypress.Cookies.clearCypressCookies()
  },

  _setUnload () {
    $Cypress.Cookies.setCy('unload', true)
  },

  _logError (...args) {
    if (console.clear) console.clear() // eslint-disable-line no-console
    console.error(...args) // eslint-disable-line no-console
  },
}
