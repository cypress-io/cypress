/* global $, $Cypress, io */

import _ from 'lodash'
import { EventEmitter } from 'events'
import Promise from 'bluebird'
import { action } from 'mobx'

import automation from './automation'
import logs from './logs'
import logger from './logger'
import tests from './tests'
import overrides from './overrides'
import state from './state'

// TODO: loadModules should be default true
const driver = $Cypress.create({ loadModules: true })
const channel = io.connect({ path: '/__socket.io' })

channel.on('connect', () => {
  channel.emit('runner:connected')
})

const driverToReporterEvents = 'paused'.split(' ')
const driverToLocalAndReporterEvents = 'run:start run:end'.split(' ')
const driverToSocketEvents = 'fixture request history:entries exec domain:set domain:change'.split(' ')
const driverTestEvents = 'test:before:run test:after:run'.split(' ')
const driverAutomationEvents = 'get:cookies get:cookie set:cookie clear:cookies clear:cookie'.split(' ')
const driverToLocalEvents = 'viewport config stop url:changed page:loading'.split(' ')
const socketRerunEvents = 'runner:restart watched:file:changed'.split(' ')

const localBus = new EventEmitter()
// when detached, this will be the socket channel
const reporterBus = new EventEmitter()

function serializeLog (log) {
  // for now, simulate what it's like to serialize the log,
  // since we'll have to when sending over web sockets
  const serializedLog = JSON.parse(JSON.stringify(log.toJSON()))
  const error = log.get('error')
  if (error) serializedLog.error = error.toString()
  const renderProps = log.get('renderProps')
  return _.extend(serializedLog, renderProps && renderProps.apply(log.attributes))
}

export default {
  reporterBus,

  ensureAutomation (connectionInfo) {
    channel.emit('is:automation:connected', connectionInfo, action('automationEnsured', (isConnected) => {
      state.automation = isConnected ? automation.CONNECTED : automation.MISSING
      channel.on('automation:disconnected', action('automationDisconnected', () => {
        state.automation = automation.DISCONNECTED
      }))
    }))
  },

  start (config, specSrc) {
    if (config.env === 'development') overrides.overloadMochaRunnerUncaught()

    driver.setConfig(_.pick(config, 'waitForAnimations', 'animationDistanceThreshold', 'commandTimeout', 'pageLoadTimeout', 'requestTimeout', 'responseTimeout', 'environmentVariables', 'xhrUrl', 'baseUrl', 'viewportWidth', 'viewportHeight', 'execTimeout'))

    driver.start()

    channel.emit('watch:test:file', specSrc)

    driver.on('initialized', ({ runner }) => {
      reporterBus.emit('runnables:ready', runner.normalizeAll())
    })

    driver.on('log', (log) => {
      logs.add(log)
      reporterBus.emit('reporter:log:add', serializeLog(log))

      log.on('state:changed', () => {
        reporterBus.emit('reporter:log:state:changed', serializeLog(log))
      })
    })

    reporterBus.on('runner:console:error', (logId) => {
      this._withLog(logId, (log) => {
        logger.clearLog()
        const error = log.get('error')
        if (/(AssertionError|CypressError)/.test(error)) {
          logger.logFormatted(log)
        } else {
          logger.logError(error.stack)
        }
      })
    })

    reporterBus.on('runner:console:log', (logId) => {
      this._withLog(logId, (log) => {
        logger.clearLog()
        logger.logFormatted(log)
      })
    })

    _.each(driverToReporterEvents, (event) => {
      driver.on(event, (...args) => {
        reporterBus.emit(event, ...args)
      })
    })

    _.each(driverTestEvents, (event) => {
      driver.on(event, (test) => {
        tests.add(test)

        if (test.err) {
          test = _.extend({}, test, { err: test.err.toString() })
        }
        reporterBus.emit(event, test)
      })
    })

    _.each(driverToLocalAndReporterEvents, (event) => {
      driver.on(event, (...args) => {
        localBus.emit(event, ...args)
        reporterBus.emit(event, ...args)
      })
    })

    _.each(driverToSocketEvents, (event) => {
      driver.on(event, (...args) => channel.emit(event, ...args))
    })

    _.each(driverAutomationEvents, (event) => {
      driver.on(event, (...args) => channel.emit('automation:request', event, ...args))
    })

    driver.on('message', (msg, data, cb) => {
      channel.emit('client:request', msg, data, cb)
    })

    _.each(driverToLocalEvents, (event) => {
      driver.on(event, (...args) => localBus.emit(event, ...args))
    })

    _.each(socketRerunEvents, (event) => {
      channel.on(event,  this._reRun.bind(this))
    })
    reporterBus.on('runner:restart', this._reRun.bind(this))

    channel.on('runner:show:snapshot', (id) => {
      this._withLog(id, (log) => {
        localBus.emit('show:snapshot', log.get('snapshots'), log.toJSON())
      })
    })

    channel.on('runner:hide:snapshot', () => {
      localBus.emit('hide:snapshot')
    })

    reporterBus.on('runner:resume', () => {
      driver.trigger('resume:all')
    })

    reporterBus.on('runner:next', () => {
      driver.trigger('resume:next')
    })

    reporterBus.on('runner:abort', () => {
      // TODO: tell the driver not to fire 'test:after:hooks' event
      driver.abort()
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
      reporterBus.emit('reporter:restart:test:run')
      this._clearAllCookies()
      this._setUnload()
    })
  },

  run (specWindow, $autIframe) {
    driver.initialize(specWindow, $autIframe)

    // get the current runnable in case we reran mid-test due to a visit
    // to a new domain
    channel.emit('get:current:runnable', (runnable) => {
      if (runnable) {
        // TODO: need this method implemented in driver
        // driver.skipToRunnable(runnable)

        // tell reporter to clear out logs for current runnable
        reporterBus.emit('reporter:reset:current:runnable:logs')
      }

      driver.run(() => {})
    })
  },

  stop () {
    localBus.removeAllListeners()
    driver.off()
    channel.off()
    overrides.restore()
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
      tests.reset()
      localBus.emit('restart')
    })
  },

  _restart () {
    return new Promise((resolve) => {
      reporterBus.once('reporter:restarted', resolve)
      reporterBus.emit('reporter:restart:test:run')
    })
  },

  on (event, ...args) {
    localBus.on(event, ...args)
  },

  launchBrowser (browser) {
    channel.emit('reload:browser', window.location.toString(), browser && browser.name)
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

  _withLog (logId, cb) {
    let log = logs.get(logId)
    if (log) {
      cb(log)
    } else {
      logger.logError('No log found for log id', logId)
    }
  },
}
