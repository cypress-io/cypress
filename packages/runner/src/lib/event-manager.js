import _ from 'lodash'
import { EventEmitter } from 'events'
import Promise from 'bluebird'
import { action } from 'mobx'

import { client } from '@packages/socket'

import automation from './automation'
import logger from './logger'
import studioRecorder from '../studio/studio-recorder'
import selectorPlaygroundModel from '../selector-playground/selector-playground-model'

import $Cypress, { $ } from '@packages/driver'

const ws = client.connect({
  path: '/__socket.io',
  transports: ['websocket'],
})

ws.on('connect', () => {
  ws.emit('runner:connected')
})

const driverToReporterEvents = 'paused before:firefox:force:gc after:firefox:force:gc'.split(' ')
const driverToLocalAndReporterEvents = 'run:start run:end'.split(' ')
const driverToSocketEvents = 'backend:request automation:request mocha recorder:frame'.split(' ')
const driverTestEvents = 'test:before:run:async test:after:run'.split(' ')
const driverToLocalEvents = 'viewport:changed config stop url:changed page:loading visit:failed'.split(' ')
const socketRerunEvents = 'runner:restart'.split(' ')
const socketToDriverEvents = 'net:event script:error'.split(' ')
const localToReporterEvents = 'reporter:log:add reporter:log:state:changed reporter:log:remove'.split(' ')

const localBus = new EventEmitter()
const reporterBus = new EventEmitter()

// NOTE: this is exposed for testing, ideally we should only expose this if a test flag is set
window.runnerWs = ws

// NOTE: this is for testing Cypress-in-Cypress, window.Cypress is undefined here
// unless Cypress has been loaded into the AUT frame
if (window.Cypress) {
  window.eventManager = { reporterBus, localBus }
}

/**
 * @type {Cypress.Cypress}
 */
let Cypress

const eventManager = {
  reporterBus,

  getCypress () {
    return Cypress
  },

  addGlobalListeners (state, connectionInfo) {
    const rerun = () => {
      if (!this) {
        // if the tests have been reloaded
        // then nothing to rerun
        return
      }

      return this._reRun(state)
    }

    ws.emit('is:automation:client:connected', connectionInfo, action('automationEnsured', (isConnected) => {
      state.automation = isConnected ? automation.CONNECTED : automation.MISSING
      ws.on('automation:disconnected', action('automationDisconnected', () => {
        state.automation = automation.DISCONNECTED
      }))
    }))

    ws.on('change:to:url', (url) => {
      window.location.href = url
    })

    ws.on('automation:push:message', (msg, data = {}) => {
      if (!Cypress) return

      switch (msg) {
        case 'change:cookie':
          Cypress.Cookies.log(data.message, data.cookie, data.removed)
          break
        case 'create:download':
          Cypress.downloads.start(data)
          break
        case 'complete:download':
          Cypress.downloads.end(data)
          break
        default:
          break
      }
    })

    ws.on('watched:file:changed', () => {
      studioRecorder.cancel()
      rerun()
    })

    _.each(socketRerunEvents, (event) => {
      ws.on(event, rerun)
    })

    _.each(socketToDriverEvents, (event) => {
      ws.on(event, (...args) => {
        Cypress.emit(event, ...args)
      })
    })

    _.each(localToReporterEvents, (event) => {
      localBus.on(event, (...args) => {
        reporterBus.emit(event, ...args)
      })
    })

    const logCommand = (logId) => {
      const consoleProps = Cypress.runner.getConsolePropsForLogById(logId)

      logger.logFormatted(consoleProps)
    }

    reporterBus.on('runner:console:error', ({ err, commandId }) => {
      if (!Cypress) return

      if (commandId || err) logger.clearLog()

      if (commandId) logCommand(commandId)

      if (err) logger.logError(err.stack)
    })

    reporterBus.on('runner:console:log', (logId) => {
      if (!Cypress) return

      logger.clearLog()
      logCommand(logId)
    })

    reporterBus.on('focus:tests', this.focusTests)

    reporterBus.on('get:user:editor', (cb) => {
      ws.emit('get:user:editor', cb)
    })

    reporterBus.on('set:user:editor', (editor) => {
      ws.emit('set:user:editor', editor)
    })

    reporterBus.on('runner:restart', rerun)

    function sendEventIfSnapshotProps (logId, event) {
      if (!Cypress) return

      const snapshotProps = Cypress.runner.getSnapshotPropsForLogById(logId)

      if (snapshotProps) {
        localBus.emit(event, snapshotProps)
      }
    }

    reporterBus.on('runner:show:snapshot', (logId) => {
      sendEventIfSnapshotProps(logId, 'show:snapshot')
    })

    reporterBus.on('runner:hide:snapshot', this._hideSnapshot.bind(this))

    reporterBus.on('runner:pin:snapshot', (logId) => {
      sendEventIfSnapshotProps(logId, 'pin:snapshot')
    })

    reporterBus.on('runner:unpin:snapshot', this._unpinSnapshot.bind(this))

    reporterBus.on('runner:resume', () => {
      if (!Cypress) return

      Cypress.emit('resume:all')
    })

    reporterBus.on('runner:next', () => {
      if (!Cypress) return

      Cypress.emit('resume:next')
    })

    reporterBus.on('runner:stop', () => {
      if (!Cypress) return

      Cypress.stop()
    })

    reporterBus.on('save:state', (state) => {
      this.saveState(state)
    })

    reporterBus.on('external:open', (url) => {
      ws.emit('external:open', url)
    })

    reporterBus.on('open:file', (url) => {
      ws.emit('open:file', url)
    })

    const studioInit = () => {
      ws.emit('studio:init', (showedStudioModal) => {
        if (!showedStudioModal) {
          studioRecorder.showInitModal()
        } else {
          rerun()
        }
      })
    }

    reporterBus.on('studio:init:test', (testId) => {
      studioRecorder.setTestId(testId)

      studioInit()
    })

    reporterBus.on('studio:init:suite', (suiteId) => {
      studioRecorder.setSuiteId(suiteId)

      studioInit()
    })

    reporterBus.on('studio:cancel', () => {
      studioRecorder.cancel()
      rerun()
    })

    reporterBus.on('studio:remove:command', (commandId) => {
      studioRecorder.removeLog(commandId)
    })

    reporterBus.on('studio:save', () => {
      studioRecorder.startSave()
    })

    localBus.on('studio:start', () => {
      studioRecorder.closeInitModal()
      rerun()
    })

    localBus.on('studio:save', (saveInfo) => {
      ws.emit('studio:save', saveInfo, (err) => {
        if (err) {
          reporterBus.emit('test:set:state', studioRecorder.saveError(err), _.noop)
        }
      })
    })

    localBus.on('studio:cancel', () => {
      studioRecorder.cancel()
      rerun()
    })

    const $window = $(window)

    $window.on('hashchange', rerun)

    // when we actually unload then
    // nuke all of the cookies again
    // so we clear out unload
    $window.on('unload', () => {
      this._clearAllCookies()
    })

    // when our window triggers beforeunload
    // we know we've change the URL and we need
    // to clear our cookies
    // additionally we set unload to true so
    // that Cypress knows not to set any more
    // cookies
    $window.on('beforeunload', () => {
      reporterBus.emit('reporter:restart:test:run')

      this._clearAllCookies()
      this._setUnload()
    })
  },

  start (config) {
    if (config.socketId) {
      ws.emit('app:connect', config.socketId)
    }
  },

  setup (config) {
    Cypress = this.Cypress = $Cypress.create(config)

    // expose Cypress globally
    window.Cypress = Cypress

    this._addListeners()

    ws.emit('watch:test:file', config.spec)
  },

  isBrowser (browserName) {
    if (!this.Cypress) return false

    return this.Cypress.isBrowser(browserName)
  },

  initialize ($autIframe, config) {
    performance.mark('initialize-start')

    return Cypress.initialize({
      $autIframe,
      onSpecReady: () => {
        // get the current runnable in case we reran mid-test due to a visit
        // to a new domain
        ws.emit('get:existing:run:state', (state = {}) => {
          if (!Cypress.runner) {
            // the tests have been reloaded
            return
          }

          this._restoreStudioFromState(state)

          this._initializeStudio(config)

          const runnables = Cypress.runner.normalizeAll(state.tests)

          const run = () => {
            performance.mark('initialize-end')
            performance.measure('initialize', 'initialize-start', 'initialize-end')

            this._runDriver(state)
          }

          reporterBus.emit('runnables:ready', runnables)

          if (state.numLogs) {
            Cypress.runner.setNumLogs(state.numLogs)
          }

          if (state.startTime) {
            Cypress.runner.setStartTime(state.startTime)
          }

          if (config.isTextTerminal && !state.currentId) {
            // we are in run mode and it's the first load
            // store runnables in backend and maybe send to dashboard
            return ws.emit('set:runnables:and:maybe:record:tests', runnables, run)
          }

          if (state.currentId) {
            // if we have a currentId it means
            // we need to tell the Cypress to skip
            // ahead to that test
            Cypress.runner.resumeAtTest(state.currentId, state.emissions)
          }

          run()
        })
      },
    })
  },

  _addListeners () {
    Cypress.on('message', (msg, data, cb) => {
      ws.emit('client:request', msg, data, cb)
    })

    _.each(driverToSocketEvents, (event) => {
      Cypress.on(event, (...args) => {
        return ws.emit(event, ...args)
      })
    })

    Cypress.on('collect:run:state', () => {
      if (Cypress.env('NO_COMMAND_LOG')) {
        return Promise.resolve()
      }

      return new Promise((resolve) => {
        reporterBus.emit('reporter:collect:run:state', (reporterState) => {
          resolve({
            ...reporterState,
            studioTestId: studioRecorder.testId,
            studioSuiteId: studioRecorder.suiteId,
            studioUrl: studioRecorder.url,
          })
        })
      })
    })

    Cypress.on('log:added', (log) => {
      const displayProps = Cypress.runner.getDisplayPropsForLog(log)

      this._interceptStudio(displayProps)

      reporterBus.emit('reporter:log:add', displayProps)
    })

    Cypress.on('log:changed', (log) => {
      const displayProps = Cypress.runner.getDisplayPropsForLog(log)

      this._interceptStudio(displayProps)

      reporterBus.emit('reporter:log:state:changed', displayProps)
    })

    Cypress.on('before:screenshot', (config, cb) => {
      const beforeThenCb = () => {
        localBus.emit('before:screenshot', config)
        cb()
      }

      if (Cypress.env('NO_COMMAND_LOG')) {
        return beforeThenCb()
      }

      const wait = !config.appOnly && config.waitForCommandSynchronization

      if (!config.appOnly) {
        reporterBus.emit('test:set:state', _.pick(config, 'id', 'isOpen'), wait ? beforeThenCb : undefined)
      }

      if (!wait) beforeThenCb()
    })

    Cypress.on('after:screenshot', (config) => {
      localBus.emit('after:screenshot', config)
    })

    _.each(driverToReporterEvents, (event) => {
      Cypress.on(event, (...args) => {
        reporterBus.emit(event, ...args)
      })
    })

    _.each(driverTestEvents, (event) => {
      Cypress.on(event, (test, cb) => {
        reporterBus.emit(event, test, cb)
      })
    })

    _.each(driverToLocalAndReporterEvents, (event) => {
      Cypress.on(event, (...args) => {
        localBus.emit(event, ...args)
        reporterBus.emit(event, ...args)
      })
    })

    _.each(driverToLocalEvents, (event) => {
      Cypress.on(event, (...args) => {
        return localBus.emit(event, ...args)
      })
    })

    Cypress.on('script:error', (err) => {
      Cypress.stop()
      localBus.emit('script:error', err)
    })

    Cypress.on('test:before:run:async', (test) => {
      if (studioRecorder.suiteId) {
        studioRecorder.setTestId(test.id)
      }

      if (studioRecorder.hasRunnableId && test.invocationDetails) {
        studioRecorder.setFileDetails(test.invocationDetails)
      }
    })

    Cypress.on('test:after:run', (test) => {
      if (studioRecorder.isOpen && test.state !== 'passed') {
        studioRecorder.testFailed()
      }
    })
  },

  _runDriver (state) {
    performance.mark('run-s')
    Cypress.run(() => {
      performance.mark('run-e')
      performance.measure('run', 'run-s', 'run-e')
    })

    reporterBus.emit('reporter:start', {
      firefoxGcInterval: Cypress.getFirefoxGcInterval(),
      startTime: Cypress.runner.getStartTime(),
      numPassed: state.passed,
      numFailed: state.failed,
      numPending: state.pending,
      autoScrollingEnabled: state.autoScrollingEnabled,
      scrollTop: state.scrollTop,
      studioActive: studioRecorder.hasRunnableId,
    })
  },

  stop () {
    localBus.removeAllListeners()
    ws.off()
  },

  _reRun (state) {
    if (!Cypress) return

    state.setIsLoading(true)

    // when we are re-running we first
    // need to stop cypress always
    Cypress.stop()

    studioRecorder.setInactive()
    selectorPlaygroundModel.setOpen(false)

    return this._restart()
    .then(() => {
      // this probably isn't 100% necessary
      // since Cypress will fall out of scope
      // but we want to be aggressive here
      // and force GC early and often
      Cypress.removeAllListeners()

      localBus.emit('restart')
    })
  },

  _restart () {
    return new Promise((resolve) => {
      reporterBus.once('reporter:restarted', resolve)
      reporterBus.emit('reporter:restart:test:run')
    })
  },

  _restoreStudioFromState (state) {
    if (state.studioTestId) {
      studioRecorder.setTestId(state.studioTestId)
    }

    if (state.studioSuiteId) {
      studioRecorder.setSuiteId(state.studioSuiteId)
    }

    if (state.studioUrl) {
      studioRecorder.setUrl(state.studioUrl)
    }
  },

  _initializeStudio (config) {
    if (studioRecorder.hasRunnableId) {
      studioRecorder.startLoading()

      if (studioRecorder.suiteId) {
        Cypress.runner.setOnlySuiteId(studioRecorder.suiteId)

        // root runnable always has id of r1
        // and does not have invocationDetails so we must set manually from config
        if (studioRecorder.suiteId === 'r1') {
          studioRecorder.setFileDetails({
            absoluteFile: config.spec.absolute,
            line: null,
            column: null,
          })
        }
      } else if (studioRecorder.testId) {
        Cypress.runner.setOnlyTestId(studioRecorder.testId)
      }
    }
  },

  _interceptStudio (displayProps) {
    if (studioRecorder.isActive) {
      displayProps.hookId = studioRecorder.hookId

      if (displayProps.name === 'visit' && displayProps.state === 'failed') {
        studioRecorder.testFailed()
        reporterBus.emit('test:set:state', studioRecorder.testError, _.noop)
      }
    }

    return displayProps
  },

  emit (event, ...args) {
    localBus.emit(event, ...args)
  },

  on (event, ...args) {
    localBus.on(event, ...args)
  },

  notifyRunningSpec (specFile) {
    ws.emit('spec:changed', specFile)
  },

  focusTests () {
    ws.emit('focus:tests')
  },

  snapshotUnpinned () {
    this._unpinSnapshot()
    this._hideSnapshot()
    reporterBus.emit('reporter:snapshot:unpinned')
  },

  _unpinSnapshot () {
    localBus.emit('unpin:snapshot')
  },

  _hideSnapshot () {
    localBus.emit('hide:snapshot')
  },

  launchBrowser (browser) {
    ws.emit('reload:browser', window.location.toString(), browser && browser.name)
  },

  // clear all the cypress specific cookies
  // whenever our app starts
  // and additional when we stop running our tests
  _clearAllCookies () {
    if (!Cypress) return

    Cypress.Cookies.clearCypressCookies()
  },

  _setUnload () {
    if (!Cypress) return

    Cypress.Cookies.setCy('unload', true)
  },

  saveState (state) {
    ws.emit('save:app:state', state)
  },
}

export default eventManager
