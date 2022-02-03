import Bluebird from 'bluebird'
import { EventEmitter } from 'events'
import type { BaseStore } from '@packages/runner-shared/src/store'
import type { RunState } from '@packages/types/src/driver'
import type MobX from 'mobx'
import type { LocalBusEmitsMap, LocalBusEventMap, DriverToLocalBus, SocketToDriverMap } from './event-manager-types'
import type { AutomationElementId, FileDetails } from '@packages/types'

import { automation } from '@packages/runner-shared/src/automation'
import { logger } from '@packages/runner-shared/src/logger'
import type { Socket } from '@packages/socket/lib/browser'
import { useRunnerUiStore } from '../store'

// type is default export of '@packages/driver'
// cannot import because it's not type safe and tsc throw many type errors.
type $Cypress = any

const noop = () => {}

interface AddGlobalListenerOptions {
  element: AutomationElementId
  randomString: string
}

const driverToReporterEvents = 'paused session:add'.split(' ')
const driverToLocalAndReporterEvents = 'run:start run:end'.split(' ')
const driverToSocketEvents = 'backend:request automation:request mocha recorder:frame'.split(' ')
const driverTestEvents = 'test:before:run:async test:after:run'.split(' ')
const driverToLocalEvents = 'viewport:changed config stop url:changed page:loading visit:failed visit:blank'.split(' ')
const socketRerunEvents = 'runner:restart watched:file:changed'.split(' ')
const socketToDriverEvents = 'net:stubbing:event request:event script:error'.split(' ')
const localToReporterEvents = 'reporter:log:add reporter:log:state:changed reporter:log:remove'.split(' ')

/**
 * @type {Cypress.Cypress}
 */
let Cypress

export class EventManager {
  reporterBus: EventEmitter = new EventEmitter()
  localBus: EventEmitter = new EventEmitter()
  Cypress?: $Cypress
  studioRecorder: any
  selectorPlaygroundModel: any

  constructor (
    // import '@packages/driver'
    private $CypressDriver: any,
    // import * as MobX
    private Mobx: typeof MobX,
    // selectorPlaygroundModel singleton
    selectorPlaygroundModel: any,
    // StudioRecorder constructor
    StudioRecorderCtor: any,
    private ws: Socket,
  ) {
    this.studioRecorder = new StudioRecorderCtor(this)
    this.selectorPlaygroundModel = selectorPlaygroundModel
  }

  getCypress () {
    return Cypress
  }

  addGlobalListeners (state: BaseStore, options: AddGlobalListenerOptions) {
    const rerun = () => {
      if (!this) {
        // if the tests have been reloaded
        // then there is nothing to rerun
        return
      }

      return this.runSpec(state)
    }

    const connectionInfo: AddGlobalListenerOptions = {
      element: options.element,
      randomString: options.randomString,
    }

    const runnerUiStore = useRunnerUiStore()

    this.ws.emit('is:automation:client:connected', connectionInfo, (isConnected: boolean) => {
      const connected = isConnected ? automation.CONNECTED : automation.MISSING

      // legacy MobX integration
      // TODO: can we delete this, or does the driver depend on this somehow?
      this.Mobx.runInAction(() => {
        state.automation = connected
      })

      this.ws.on('automation:disconnected', () => {
        this.Mobx.runInAction(() => {
          state.automation = automation.DISCONNECTED
        })
      })

      // unified integration
      this.ws.on('automation:disconnected', () => {
        runnerUiStore.setAutomationStatus('DISCONNECTED')
      })

      runnerUiStore.setAutomationStatus(connected)
    })

    this.ws.on('change:to:url', (url) => {
      window.location.href = url
    })

    this.ws.on('automation:push:message', (msg, data = {}) => {
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

    this.ws.on('watched:file:changed', () => {
      this.studioRecorder.cancel()
      rerun()
    })

    this.ws.on('specs:changed', ({ specs, testingType }) => {
      // do not emit the event if e2e runner is not displaying an inline spec list.
      if (testingType === 'e2e' && state.useInlineSpecList === false) {
        return
      }

      state.setSpecs(specs)
    })

    this.ws.on('dev-server:hmr:error', (error) => {
      Cypress.stop()
      this.localBus.emit('script:error', error)
    })

    this.ws.on('dev-server:compile:success', ({ specFile }) => {
      if (!specFile || specFile === state?.spec?.absolute) {
        rerun()
      }
    })

    socketRerunEvents.forEach((event) => {
      this.ws.on(event, rerun)
    })

    socketToDriverEvents.forEach((event) => {
      this.ws.on(event, (...args) => {
        if (!Cypress) return

        Cypress.emit(event, ...args)
      })
    })

    localToReporterEvents.forEach((event) => {
      this.localBus.on(event, (...args) => {
        this.reporterBus.emit(event, ...args)
      })
    })

    const logCommand = (logId) => {
      const consoleProps = Cypress.runner.getConsolePropsForLogById(logId)

      logger.logFormatted(consoleProps)
    }

    this.reporterBus.on('runner:console:error', ({ err, commandId }) => {
      if (!Cypress) return

      if (commandId || err) logger.clearLog()

      if (commandId) logCommand(commandId)

      if (err) logger.logError(err.stack)
    })

    this.reporterBus.on('runner:console:log', (logId) => {
      if (!Cypress) return

      logger.clearLog()
      logCommand(logId)
    })

    this.reporterBus.on('set:user:editor', (editor) => {
      this.ws.emit('set:user:editor', editor)
    })

    this.reporterBus.on('runner:restart', rerun)

    const sendEventIfSnapshotProps = (logId, event) => {
      if (!Cypress) return

      const snapshotProps = Cypress.runner.getSnapshotPropsForLogById(logId)

      if (snapshotProps) {
        this.localBus.emit(event, snapshotProps)
      }
    }

    this.reporterBus.on('runner:show:snapshot', (logId) => {
      sendEventIfSnapshotProps(logId, 'show:snapshot')
    })

    this.reporterBus.on('runner:hide:snapshot', this._hideSnapshot.bind(this))

    this.reporterBus.on('runner:pin:snapshot', (logId) => {
      sendEventIfSnapshotProps(logId, 'pin:snapshot')
    })

    this.reporterBus.on('runner:unpin:snapshot', this._unpinSnapshot.bind(this))

    this.reporterBus.on('runner:resume', () => {
      if (!Cypress) return

      Cypress.emit('resume:all')
    })

    this.reporterBus.on('runner:next', () => {
      if (!Cypress) return

      Cypress.emit('resume:next')
    })

    this.reporterBus.on('runner:stop', () => {
      if (!Cypress) return

      Cypress.stop()
    })

    this.reporterBus.on('save:state', (state) => {
      this.saveState(state)
    })

    this.reporterBus.on('clear:session', () => {
      if (!Cypress) return

      Cypress.backend('clear:session')
      .then(() => {
        rerun()
      })
    })

    this.reporterBus.on('external:open', (url) => {
      this.ws.emit('external:open', url)
    })

    this.reporterBus.on('get:user:editor', (cb) => {
      this.ws.emit('get:user:editor', cb)
    })

    this.reporterBus.on('open:file:unified', (file: FileDetails) => {
      this.emit('open:file', file)
    })

    this.reporterBus.on('open:file', (url) => {
      this.ws.emit('open:file', url)
    })

    const studioInit = () => {
      this.ws.emit('studio:init', (showedStudioModal) => {
        if (!showedStudioModal) {
          this.studioRecorder.showInitModal()
        } else {
          rerun()
        }
      })
    }

    this.reporterBus.on('studio:init:test', (testId) => {
      this.studioRecorder.setTestId(testId)

      studioInit()
    })

    this.reporterBus.on('studio:init:suite', (suiteId) => {
      this.studioRecorder.setSuiteId(suiteId)

      studioInit()
    })

    this.reporterBus.on('studio:cancel', () => {
      this.studioRecorder.cancel()
      rerun()
    })

    this.reporterBus.on('studio:remove:command', (commandId) => {
      this.studioRecorder.removeLog(commandId)
    })

    this.reporterBus.on('studio:save', () => {
      this.studioRecorder.startSave()
    })

    this.reporterBus.on('studio:copy:to:clipboard', (cb) => {
      this._studioCopyToClipboard(cb)
    })

    this.localBus.on('studio:start', () => {
      this.studioRecorder.closeInitModal()
      rerun()
    })

    this.localBus.on('studio:copy:to:clipboard', (cb) => {
      this._studioCopyToClipboard(cb)
    })

    this.localBus.on('studio:save', (saveInfo) => {
      this.ws.emit('studio:save', saveInfo, (err) => {
        if (err) {
          this.reporterBus.emit('test:set:state', this.studioRecorder.saveError(err), noop)
        }
      })
    })

    this.localBus.on('studio:cancel', () => {
      this.studioRecorder.cancel()
      rerun()
    })

    // @ts-ignore
    const $window = this.$CypressDriver.$(window)

    // This is a test-only even. It's used to
    // trigger a re-reun for the drive rerun.cy.js spec.
    $window.on('test:trigger:rerun', rerun)

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
      this.reporterBus.emit('reporter:restart:test:run')

      this._clearAllCookies()
      this._setUnload()
    })
  }

  start (config) {
    if (config.socketId) {
      this.ws.emit('app:connect', config.socketId)
    }
  }

  setup (config) {
    Cypress = this.Cypress = this.$CypressDriver.create(config)

    // expose Cypress globally
    // @ts-ignore
    window.Cypress = Cypress

    this._addListeners()

    this.ws.emit('watch:test:file', config.spec)
  }

  isBrowser (browserName) {
    if (!this.Cypress) return false

    return this.Cypress.isBrowser(browserName)
  }

  initialize ($autIframe: JQuery<HTMLIFrameElement>, config: Record<string, any>) {
    performance.mark('initialize-start')

    return Cypress.initialize({
      $autIframe,
      onSpecReady: () => {
        // get the current runnable in case we reran mid-test due to a visit
        // to a new domain
        this.ws.emit('get:existing:run:state', (state: RunState = {}) => {
          if (!Cypress.runner) {
            // the tests have been reloaded
            return
          }

          this.studioRecorder.initialize(config, state)

          const runnables = Cypress.runner.normalizeAll(state.tests)

          const run = () => {
            performance.mark('initialize-end')
            performance.measure('initialize', 'initialize-start', 'initialize-end')

            this._runDriver(state)
          }

          this.reporterBus.emit('runnables:ready', runnables)

          if (state?.numLogs) {
            Cypress.runner.setNumLogs(state.numLogs)
          }

          if (state.startTime) {
            Cypress.runner.setStartTime(state.startTime)
          }

          if (config.isTextTerminal && !state.currentId) {
            // we are in run mode and it's the first load
            // store runnables in backend and maybe send to dashboard
            return this.ws.emit('set:runnables:and:maybe:record:tests', runnables, run)
          }

          if (state.currentId) {
            // if we have a currentId it means
            // we need to tell the Cypress to skip
            // ahead to that test
            Cypress.runner.resumeAtTest(state.currentId, state.emissions)
          }

          return run()
        })
      },
    })
  }

  _addListeners () {
    Cypress.on('message', (msg, data, cb) => {
      this.ws.emit('client:request', msg, data, cb)
    })

    driverToSocketEvents.forEach((event) => {
      Cypress.on(event, (...args) => {
        return this.ws.emit(event, ...args)
      })
    })

    Cypress.on('collect:run:state', () => {
      if (Cypress.env('NO_COMMAND_LOG')) {
        return Bluebird.resolve()
      }

      return new Bluebird((resolve) => {
        this.reporterBus.emit('reporter:collect:run:state', (reporterState) => {
          resolve({
            ...reporterState,
            studio: this.studioRecorder.state,
          })
        })
      })
    })

    Cypress.on('log:added', (log) => {
      // TODO: Race condition in unified runner - we should not need this null check
      if (!Cypress.runner) {
        return
      }

      const displayProps = Cypress.runner.getDisplayPropsForLog(log)

      this._interceptStudio(displayProps)

      this.reporterBus.emit('reporter:log:add', displayProps)
    })

    Cypress.on('log:changed', (log) => {
      // TODO: Race condition in unified runner - we should not need this null check
      if (!Cypress.runner) {
        return
      }

      const displayProps = Cypress.runner.getDisplayPropsForLog(log)

      this._interceptStudio(displayProps)

      this.reporterBus.emit('reporter:log:state:changed', displayProps)
    })

    Cypress.on('before:screenshot', (config, cb) => {
      const beforeThenCb = () => {
        this.localBus.emit('before:screenshot', config)
        cb()
      }

      if (Cypress.env('NO_COMMAND_LOG')) {
        return beforeThenCb()
      }

      const wait = !config.appOnly && config.waitForCommandSynchronization

      if (!config.appOnly) {
        const { id, isOpen } = config

        this.reporterBus.emit('test:set:state', { id, isOpen }, wait ? beforeThenCb : undefined)
      }

      if (!wait) beforeThenCb()
    })

    Cypress.on('after:screenshot', (config) => {
      this.localBus.emit('after:screenshot', config)
    })

    driverToReporterEvents.forEach((event) => {
      Cypress.on(event, (...args) => {
        this.reporterBus.emit(event, ...args)
      })
    })

    driverTestEvents.forEach((event) => {
      Cypress.on(event, (test, cb) => {
        this.reporterBus.emit(event, test, cb)
      })
    })

    driverToLocalAndReporterEvents.forEach((event) => {
      Cypress.on(event, (...args) => {
        this.localBus.emit(event, ...args)
        this.reporterBus.emit(event, ...args)
      })
    })

    driverToLocalEvents.forEach((event) => {
      Cypress.on(event, (...args: unknown[]) => {
        // @ts-ignore
        // TODO: strongly typed event emitter.
        return this.emit(event, ...args)
      })
    })

    Cypress.on('script:error', (err) => {
      Cypress.stop()
      this.localBus.emit('script:error', err)
    })

    Cypress.on('test:before:run:async', (_attr, test) => {
      this.studioRecorder.interceptTest(test)
    })

    Cypress.on('test:after:run', (test) => {
      if (this.studioRecorder.isOpen && test.state !== 'passed') {
        this.studioRecorder.testFailed()
      }
    })
  }

  _runDriver (state) {
    performance.mark('run-s')
    Cypress.run(() => {
      performance.mark('run-e')
      performance.measure('run', 'run-s', 'run-e')
    })

    this.reporterBus.emit('reporter:start', {
      startTime: Cypress.runner.getStartTime(),
      numPassed: state.passed,
      numFailed: state.failed,
      numPending: state.pending,
      autoScrollingEnabled: state.autoScrollingEnabled,
      isSpecsListOpen: state.isSpecsListOpen,
      scrollTop: state.scrollTop,
      studioActive: this.studioRecorder.hasRunnableId,
    })
  }

  stop () {
    this.localBus.removeAllListeners()
    this.ws.off()
  }

  async teardown (state: BaseStore) {
    if (!Cypress) {
      return
    }

    state.setIsLoading(true)

    // when we are re-running we first
    // need to stop cypress always
    Cypress.stop()

    this.studioRecorder.setInactive()
    this.selectorPlaygroundModel.setOpen(false)
  }

  resetReporter () {
    return new Bluebird((resolve) => {
      this.reporterBus.once('reporter:restarted', resolve)
      this.reporterBus.emit('reporter:restart:test:run')
    })
  }

  async _rerun () {
    await this.resetReporter()

    // this probably isn't 100% necessary
    // since Cypress will fall out of scope
    // but we want to be aggressive here
    // and force GC early and often
    Cypress.removeAllListeners()

    this.localBus.emit('restart')
  }

  async runSpec (state: BaseStore) {
    if (!Cypress) {
      return
    }

    await this.teardown(state)

    return this._rerun()
  }

  _interceptStudio (displayProps) {
    if (this.studioRecorder.isActive) {
      displayProps.hookId = this.studioRecorder.hookId

      if (displayProps.name === 'visit' && displayProps.state === 'failed') {
        this.studioRecorder.testFailed()
        this.reporterBus.emit('test:set:state', this.studioRecorder.testError, noop)
      }
    }

    return displayProps
  }

  _studioCopyToClipboard (cb) {
    this.ws.emit('studio:get:commands:text', this.studioRecorder.logs, (commandsText) => {
      this.studioRecorder.copyToClipboard(commandsText)
      .then(cb)
    })
  }

  emit<K extends Extract<keyof LocalBusEmitsMap, string>>(k: K, v: LocalBusEmitsMap[K]): void
  emit<K extends Extract<keyof DriverToLocalBus, string>>(k: K, v: DriverToLocalBus[K]): void
  emit<K extends Extract<keyof SocketToDriverMap, string>>(k: K, v: SocketToDriverMap[K]): void
  emit (event: string, ...args: any[]) {
    this.localBus.emit(event, ...args)
  }

  on<K extends Extract<keyof LocalBusEventMap, string>>(k: K, f: (v: LocalBusEventMap[K]) => void): void
  on<K extends Extract<keyof DriverToLocalBus, string>>(k: K, f: (v: DriverToLocalBus[K]) => void): void
  on<K extends Extract<keyof SocketToDriverMap, string>>(k: K, f: (v: SocketToDriverMap[K]) => void): void
  on (event: string, listener: (...args: any[]) => void): void
  on (event: string, listener: (...args: any[]) => void) {
    this.localBus.on(event, listener)
  }

  off (event: string, listener: (...args: any[]) => void) {
    this.localBus.off(event, listener)
  }

  notifyRunningSpec (specFile) {
    this.ws.emit('spec:changed', specFile)
  }

  snapshotUnpinned () {
    this._unpinSnapshot()
    this._hideSnapshot()
    this.reporterBus.emit('reporter:snapshot:unpinned')
  }

  _unpinSnapshot () {
    this.localBus.emit('unpin:snapshot')
  }

  _hideSnapshot () {
    this.localBus.emit('hide:snapshot')
  }

  launchBrowser (browser) {
    this.ws.emit('reload:browser', window.location.toString(), browser && browser.name)
  }

  // clear all the cypress specific cookies
  // whenever our app starts
  // and additional when we stop running our tests
  _clearAllCookies () {
    if (!Cypress) return

    Cypress.Cookies.clearCypressCookies()
  }

  _setUnload () {
    if (!Cypress) return

    Cypress.Cookies.setCy('unload', true)
  }

  saveState (state) {
    this.localBus.emit('save:app:state', state)
  }

  // usefulf for testing
  _testingOnlySetCypress (cypress: any) {
    Cypress = cypress
  }
}
