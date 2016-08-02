/* global $, $Cypress, io */

import _ from 'lodash'
import { EventEmitter } from 'events'
import Promise from 'bluebird'
import { action } from 'mobx'

import automation from './automation'
import logger from './logger'
import overrides from './overrides'

// TODO: loadModules should be default true
const driver = $Cypress.create({ loadModules: true })
const channel = io.connect({ path: '/__socket.io' })

channel.on('connect', () => {
  channel.emit('runner:connected')
})

const driverToReporterEvents = 'paused'.split(' ')
const driverToLocalAndReporterEvents = 'run:start run:end'.split(' ')
const driverToSocketEvents = 'fixture request history:entries exec set:domain resolve:domain preserve:run:state'.split(' ')
const driverTestEvents = 'test:before:run test:after:run'.split(' ')
const driverAutomationEvents = 'get:cookies get:cookie set:cookie clear:cookies clear:cookie take:screenshot'.split(' ')
const driverToLocalEvents = 'viewport config stop url:changed page:loading visit:failed'.split(' ')
const socketRerunEvents = 'runner:restart watched:file:changed'.split(' ')

const localBus = new EventEmitter()
// when detached, this will be the socket channel
const reporterBus = new EventEmitter()

export default {
  reporterBus,

  init (state, connectionInfo) {
    channel.emit('is:automation:connected', connectionInfo, action('automationEnsured', (isConnected) => {
      state.automation = isConnected ? automation.CONNECTED : automation.MISSING
      channel.on('automation:disconnected', action('automationDisconnected', () => {
        state.automation = automation.DISCONNECTED
      }))
    }))

    channel.on('change:to:url', (url) => {
      window.location.href = url
    })
  },

  start (config) {
    if (config.env === 'development') overrides.overloadMochaRunnerUncaught()

    if (config.socketId) {
      channel.emit('app:connect', config.socketId)
    }

    driver.on('message', (msg, data, cb) => {
      channel.emit('client:request', msg, data, cb)
    })

    _.each(driverToSocketEvents, (event) => {
      driver.on(event, (...args) => channel.emit(event, ...args))
    })

    _.each(driverAutomationEvents, (event) => {
      driver.on(event, (...args) => channel.emit('automation:request', event, ...args))
    })

    reporterBus.on('focus:tests', this.focusTests)

    return driver.setConfig(_.pick(config, 'numTestsKeptInMemory', 'waitForAnimations', 'animationDistanceThreshold', 'commandTimeout', 'pageLoadTimeout', 'requestTimeout', 'responseTimeout', 'environmentVariables', 'xhrUrl', 'baseUrl', 'viewportWidth', 'viewportHeight', 'execTimeout', 'screenshotOnHeadlessFailure', 'namespace', 'remote'))
    .then(() => {
      driver.start()

      this._addListeners()
    })
  },

  _addListeners () {
    driver.on('initialized', ({ runner }) => {
      driver.on('collect:run:state', () => new Promise((resolve) => {
        reporterBus.emit('reporter:collect:run:state', resolve)
      }))

      // get the current runnable in case we reran mid-test due to a visit
      // to a new domain
      channel.emit('get:existing:run:state', (state = {}) => {
        reporterBus.emit('runnables:ready', runner.normalizeAll(state.tests))

        if (state.numLogs) {
          runner.setNumLogs(state.numLogs)
        }

        if (state.startTime) {
          runner.setStartTime(state.startTime)
        }

        if (state.currentId) {
          // if we have a currentId it means
          // we need to tell the runner to skip
          // ahead to that test
          runner.resumeAtTest(state.currentId)
        }

        driver.run(() => {})

        reporterBus.emit('reporter:start', {
          startTime: driver.getStartTime(),
          numPassed: state.passed,
          numFailed: state.failed,
          numPending: state.pending,
          autoScrollingEnabled: state.autoScrollingEnabled,
          scrollTop: state.scrollTop,
        })
      })
    })

    driver.on('log', (log) => {
      const displayProps = driver.getDisplayPropsForLog(log)
      reporterBus.emit('reporter:log:add', displayProps)
    })

    driver.on('log:state:changed', (log) => {
      const displayProps = driver.getDisplayPropsForLog(log)
      reporterBus.emit('reporter:log:state:changed', displayProps)
    })

    reporterBus.on('runner:console:error', (testId) => {
      const err = driver.getErrorByTestId(testId)
      if (err) {
        logger.clearLog()
        logger.logError(err.stack)
      } else {
        logger.logError('No error found for test id', testId)
      }
    })

    reporterBus.on('runner:console:log', (logId) => {
      const consoleProps = driver.getConsolePropsForLogById(logId)
      logger.clearLog()
      logger.logFormatted(consoleProps)
    })

    _.each(driverToReporterEvents, (event) => {
      driver.on(event, (...args) => {
        reporterBus.emit(event, ...args)
      })
    })

    _.each(driverTestEvents, (event) => {
      driver.on(event, (test) => {
        reporterBus.emit(event, test)
      })
    })

    _.each(driverToLocalAndReporterEvents, (event) => {
      driver.on(event, (...args) => {
        localBus.emit(event, ...args)
        reporterBus.emit(event, ...args)
      })
    })

    $(window).on('hashchange', this._reRun.bind(this))

    _.each(driverToLocalEvents, (event) => {
      driver.on(event, (...args) => localBus.emit(event, ...args))
    })

    _.each(socketRerunEvents, (event) => {
      channel.on(event,  this._reRun.bind(this))
    })
    reporterBus.on('runner:restart', this._reRun.bind(this))

    reporterBus.on('runner:show:snapshot', (logId) => {
      const snapshotProps = driver.getSnapshotPropsForLogById(logId)

      if (snapshotProps) {
        localBus.emit('show:snapshot', snapshotProps)
      }
    })

    reporterBus.on('runner:hide:snapshot', () => {
      localBus.emit('hide:snapshot')
    })

    reporterBus.on('runner:resume', () => {
      driver.trigger('resume:all')
    })

    reporterBus.on('runner:next', () => {
      driver.trigger('resume:next')
    })

    reporterBus.on('runner:abort', () => {
      driver.abort()
    })

    reporterBus.on('persist:state', (state) => {
      channel.emit('persist:app:state', state)
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

  run (specPath, specWindow, $autIframe) {
    channel.emit('watch:test:file', specPath)
    driver.initialize(specWindow, $autIframe)
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
    driver.abort()
    .then(() => {
      return this._restart()
    })
    .then(() => {
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

  notifyRunningSpec (specFile) {
    channel.emit('running:spec', specFile)
  },

  focusTests () {
    channel.emit('focus:tests')
  },

  launchBrowser (browser) {
    channel.emit('reload:browser', window.location.toString(), browser && browser.name)
  },

  // clear all the cypress specific cookies
  // whenever our app starts
  // and additional when we stop running our tests
  _clearAllCookies () {
    driver.Cookies.clearCypressCookies()
  },

  _setUnload () {
    driver.Cookies.setCy('unload', true)
  },

}
