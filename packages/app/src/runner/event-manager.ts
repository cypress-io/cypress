import Bluebird from 'bluebird'
import { EventEmitter } from 'events'
import type { MobxRunnerStore } from '@packages/app/src/store/mobx-runner-store'
import type MobX from 'mobx'
import type { LocalBusEmitsMap, LocalBusEventMap, DriverToLocalBus, SocketToDriverMap } from './event-manager-types'

import type { RunState, CachedTestState, AutomationElementId, FileDetails, ReporterStartInfo, ReporterRunState } from '@packages/types'

import { logger } from './logger'
import type { Socket } from '@packages/socket/lib/browser'
import { automation, useRunnerUiStore } from '../store'
import { useScreenshotStore } from '../store/screenshot-store'
import { useStudioStore } from '../store/studio-store'
import { getAutIframeModel } from '.'

export type CypressInCypressMochaEvent = Array<Array<string | Record<string, any>>>

// type is default export of '@packages/driver'
// cannot import because it's not type safe and tsc throw many type errors.
type $Cypress = any

const noop = () => {}

let crossOriginOnMessageRef = ({ data, source }: MessageEvent<{
  data: any
  source: Window
}>) => {
  return undefined
}
let crossOriginLogs: {[key: string]: Cypress.Log} = {}

interface AddGlobalListenerOptions {
  element: AutomationElementId
  randomString: string
}

const driverToReporterEvents = 'paused'.split(' ')
const driverToLocalAndReporterEvents = 'run:start run:end'.split(' ')
const driverToSocketEvents = 'backend:request automation:request mocha recorder:frame'.split(' ')
const driverTestEvents = 'test:before:run:async test:after:run'.split(' ')
const driverToLocalEvents = 'viewport:changed config stop url:changed page:loading visit:failed visit:blank cypress:in:cypress:runner:event'.split(' ')
const socketRerunEvents = 'runner:restart watched:file:changed'.split(' ')
const socketToDriverEvents = 'net:stubbing:event request:event script:error cross:origin:automation:cookies'.split(' ')
const localToReporterEvents = 'reporter:log:add reporter:log:state:changed reporter:log:remove'.split(' ')

/**
 * @type {Cypress.Cypress}
 */
let Cypress

export class EventManager {
  reporterBus: EventEmitter = new EventEmitter()
  localBus: EventEmitter = new EventEmitter()
  Cypress?: $Cypress
  selectorPlaygroundModel: any
  cypressInCypressMochaEvents: CypressInCypressMochaEvent[] = []
  // Used for testing the experimentalSingleTabRunMode experiment. Ensures AUT is correctly destroyed between specs.
  ws: Socket
  studioStore: ReturnType<typeof useStudioStore>

  constructor (
    // import '@packages/driver'
    private $CypressDriver: any,
    // import * as MobX
    private Mobx: typeof MobX,
    // selectorPlaygroundModel singleton
    selectorPlaygroundModel: any,
    ws: Socket,
  ) {
    this.selectorPlaygroundModel = selectorPlaygroundModel
    this.ws = ws
    this.studioStore = useStudioStore()
  }

  getCypress () {
    return Cypress
  }

  addGlobalListeners (state: MobxRunnerStore, options: AddGlobalListenerOptions) {
    // Moving away from the runner turns off all websocket listeners. addGlobalListeners adds them back
    // but connect is added when the websocket is created elsewhere so we need to add it back.
    if (!this.ws.hasListeners('connect')) {
      this.ws.on('connect', () => {
        this.ws.emit('runner:connected')
      })
    }

    const rerun = () => {
      if (!this) {
        // if the tests have been reloaded then there is nothing to rerun
        return
      }

      return this.rerunSpec()
    }

    const connectionInfo: AddGlobalListenerOptions = {
      element: options.element,
      randomString: options.randomString,
    }

    const runnerUiStore = useRunnerUiStore()

    this.ws.emit('is:automation:client:connected', connectionInfo, (isConnected: boolean) => {
      const connected = isConnected ? automation.CONNECTED : automation.MISSING

      // legacy MobX integration
      // TODO: UNIFY-1318 - can we delete this, or does the driver depend on this somehow?
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
      this.studioStore.cancel()
      rerun()
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

    const logCommand = (testId, logId) => {
      const consoleProps = Cypress.runner.getConsolePropsForLog(testId, logId)

      logger.logFormatted(consoleProps)
    }

    this.reporterBus.on('runner:console:error', ({ err, testId, logId }) => {
      if (!Cypress) return

      if (logId || err) logger.clearLog()

      if (logId) logCommand(testId, logId)

      if (err) logger.logError(err.stack)
    })

    this.reporterBus.on('runner:console:log', (testId, logId) => {
      if (!Cypress) return

      logger.clearLog()
      logCommand(testId, logId)
    })

    this.reporterBus.on('set:user:editor', (editor) => {
      this.ws.emit('set:user:editor', editor)
    })

    this.reporterBus.on('runner:restart', rerun)

    const sendEventIfSnapshotProps = (testId, logId, event) => {
      if (!Cypress) return

      const snapshotProps = Cypress.runner.getSnapshotPropsForLog(testId, logId)

      if (snapshotProps) {
        this.localBus.emit(event, snapshotProps)
      }
    }

    this.reporterBus.on('runner:show:snapshot', (testId, logId) => {
      sendEventIfSnapshotProps(testId, logId, 'show:snapshot')
    })

    this.reporterBus.on('runner:hide:snapshot', this._hideSnapshot.bind(this))

    this.reporterBus.on('runner:pin:snapshot', (testId, logId) => {
      sendEventIfSnapshotProps(testId, logId, 'pin:snapshot')
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

    this.reporterBus.on('clear:all:sessions', () => {
      if (!Cypress) return

      Cypress.backend('clear:sessions', true)
      .then(rerun)
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
      rerun()
    }

    this.reporterBus.on('studio:init:test', (testId) => {
      this.studioStore.setTestId(testId)

      studioInit()
    })

    this.reporterBus.on('studio:init:suite', (suiteId) => {
      this.studioStore.setSuiteId(suiteId)

      studioInit()
    })

    this.reporterBus.on('studio:cancel', () => {
      this.studioStore.cancel()
      rerun()
    })

    this.reporterBus.on('studio:remove:command', (commandId) => {
      this.studioStore.removeLog(commandId)
    })

    this.reporterBus.on('studio:save', () => {
      this.studioStore.startSave()
    })

    this.reporterBus.on('studio:copy:to:clipboard', (cb) => {
      this._studioCopyToClipboard(cb)
    })

    this.localBus.on('studio:start', () => {
      rerun()
    })

    this.localBus.on('studio:copy:to:clipboard', (cb) => {
      this._studioCopyToClipboard(cb)
    })

    this.localBus.on('studio:save', (saveInfo) => {
      this.ws.emit('studio:save', saveInfo, (err) => {
        if (err) {
          this.reporterBus.emit('test:set:state', this.studioStore.saveError(err), noop)
        }
      })
    })

    this.localBus.on('studio:cancel', () => {
      this.studioStore.cancel()
      rerun()
    })

    this.ws.on('aut:destroy:init', () => {
      const autIframe = getAutIframeModel()

      autIframe.destroy()
      this.ws.emit('aut:destroy:complete')
    })

    // @ts-ignore
    const $window = this.$CypressDriver.$(window)

    // This is a test-only event. It's used to
    // trigger a rerun for the driver rerun.cy.js spec.
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

    if (config.isTextTerminal || config.experimentalInteractiveRunEvents) {
      this.ws.emit('plugins:before:spec', config.spec)
    }
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
        // get the current runnable states and cached test state
        // in case we reran mid-test due to a visit to a new domain
        this.ws.emit('get:cached:test:state', (runState: RunState = {}, testState: CachedTestState) => {
          if (!Cypress.runner) {
            // the tests have been reloaded
            return
          }

          const hideCommandLog = window.__CYPRESS_CONFIG__.hideCommandLog

          this.studioStore.initialize(config, runState)

          const runnables = Cypress.runner.normalizeAll(runState.tests, hideCommandLog)

          const run = () => {
            performance.mark('initialize-end')
            performance.measure('initialize', 'initialize-start', 'initialize-end')

            this._runDriver(runState, testState)
          }

          if (!hideCommandLog) {
            this.reporterBus.emit('runnables:ready', runnables)
          }

          if (runState?.numLogs) {
            Cypress.runner.setNumLogs(runState.numLogs)
          }

          if (runState.startTime) {
            Cypress.runner.setStartTime(runState.startTime)
          }

          if (config.isTextTerminal && !runState.currentId) {
            // we are in run mode and it's the first load
            // store runnables in backend and maybe send to dashboard
            return this.ws.emit('set:runnables:and:maybe:record:tests', runnables, run)
          }

          if (runState.currentId) {
            // if we have a currentId it means
            // we need to tell the Cypress to skip
            // ahead to that test
            Cypress.runner.resumeAtTest(runState.currentId, runState.emissions)
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
        this.reporterBus.emit('reporter:collect:run:state', (reporterState: ReporterRunState) => {
          resolve({
            ...reporterState,
            studio: {
              testId: this.studioStore.testId,
              suiteId: this.studioStore.suiteId,
              url: this.studioStore.url,
            },
          })
        })
      })
    })

    Cypress.on('log:added', (log) => {
      // TODO: UNIFY-1318 - Race condition in unified runner - we should not need this null check
      if (!Cypress.runner) {
        return
      }

      const displayProps = Cypress.runner.getDisplayPropsForLog(log)

      this._interceptStudio(displayProps)

      this.reporterBus.emit('reporter:log:add', displayProps)
    })

    Cypress.on('log:changed', (log) => {
      // TODO: UNIFY-1318 - Race condition in unified runner - we should not need this null check
      if (!Cypress.runner) {
        return
      }

      const displayProps = Cypress.runner.getDisplayPropsForLog(log)

      this._interceptStudio(displayProps)

      this.reporterBus.emit('reporter:log:state:changed', displayProps)
    })

    // TODO: MOVE BACK INTO useEventManager. Verify this works
    const screenshotStore = useScreenshotStore()

    const handleBeforeScreenshot = (config, cb) => {
      if (config.appOnly) {
        screenshotStore.setScreenshotting(true)
      }

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
    }

    Cypress.on('before:screenshot', handleBeforeScreenshot)

    const handleAfterScreenshot = (config) => {
      screenshotStore.setScreenshotting(false)
      this.localBus.emit('after:screenshot', config)
    }

    Cypress.on('after:screenshot', handleAfterScreenshot)

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
        // special case for asserting the correct mocha events + payload
        // is emitted from cypress/driver when running e2e tests using
        // "cypress in cypress"
        if (event === 'cypress:in:cypress:runner:event') {
          this.cypressInCypressMochaEvents.push(args as CypressInCypressMochaEvent[])

          if (args[0] === 'mocha' && args[1] === 'end') {
            this.emit('cypress:in:cypress:run:complete', this.cypressInCypressMochaEvents)

            // reset
            this.cypressInCypressMochaEvents = []
          }

          return
        }

        // @ts-ignore
        // TODO: UNIFY-1318 - strongly typed event emitter.
        return this.emit(event, ...args)
      })
    })

    Cypress.on('script:error', (err) => {
      Cypress.stop()
      this.localBus.emit('script:error', err)
    })

    Cypress.on('test:before:run:async', (_attr, test) => {
      this.studioStore.interceptTest(test)
    })

    Cypress.on('test:after:run', (test) => {
      if (this.studioStore.isOpen && test.state !== 'passed') {
        this.studioStore.testFailed()
      }
    })

    Cypress.on('test:before:run', (...args) => {
      Cypress.primaryOriginCommunicator.toAllSpecBridges('test:before:run', ...args)
    })

    Cypress.on('test:before:run:async', (...args) => {
      Cypress.primaryOriginCommunicator.toAllSpecBridges('test:before:run:async', ...args)
    })

    // Inform all spec bridges that the primary origin has begun to unload.
    Cypress.on('window:before:unload', () => {
      Cypress.primaryOriginCommunicator.toAllSpecBridges('before:unload', window.origin)
    })

    // Reflect back to the requesting origin the status of the 'duringUserTestExecution' state
    Cypress.primaryOriginCommunicator.on('sync:during:user:test:execution', ({ specBridgeResponseEvent }, origin) => {
      Cypress.primaryOriginCommunicator.toSpecBridge(origin, specBridgeResponseEvent, cy.state('duringUserTestExecution'))
    })

    Cypress.on('request:snapshot:from:spec:bridge', ({ log, name, options, specBridge, addSnapshot }: {
      log: Cypress.Log
      name?: string
      options?: any
      specBridge: string
      addSnapshot: (snapshot: any, options: any, shouldRebindSnapshotFn: boolean) => Cypress.Log
    }) => {
      const eventID = log.get('id')

      const requestSnapshot = () => {
        return Cypress.primaryOriginCommunicator.toSpecBridgePromise(specBridge, 'snapshot:generate:for:log', {
          name,
          id: eventID,
        }).then((crossOriginSnapshot) => {
          const snapshot = crossOriginSnapshot.body ? crossOriginSnapshot : null

          addSnapshot.apply(log, [snapshot, options, false])
        })
      }

      requestSnapshot().catch(() => {
        // If a spec bridge isn't present to respond this isn't an error and there is nothing to do.
      })
    })

    Cypress.primaryOriginCommunicator.on('before:unload', (origin) => {
      // In webkit the before:unload event could come in after the on load event has already happened.
      // To prevent hanging we will only set the state to unstable if we are currently on the same origin as the unload event,
      // otherwise we assume that the load event has already occurred and the event is no longer relevant.
      if (Cypress.state('autLocation')?.origin === origin) {
        // We specifically don't call 'cy.isStable' here because we don't want to inject another load event.
        cy.state('isStable', false)
      }

      // Re-broadcast to any other specBridges.
      Cypress.primaryOriginCommunicator.toAllSpecBridges('before:unload', origin)
    })

    Cypress.primaryOriginCommunicator.on('expect:origin', (origin) => {
      this.localBus.emit('expect:origin', origin)
    })

    Cypress.primaryOriginCommunicator.on('viewport:changed', (viewport, origin) => {
      const callback = () => {
        Cypress.primaryOriginCommunicator.toSpecBridge(origin, 'viewport:changed:end')
      }

      Cypress.primaryOriginCommunicator.emit('sync:viewport', viewport)
      this.localBus.emit('viewport:changed', viewport, callback)
    })

    Cypress.primaryOriginCommunicator.on('before:screenshot', (config, origin) => {
      const callback = () => {
        Cypress.primaryOriginCommunicator.toSpecBridge(origin, 'before:screenshot:end')
      }

      handleBeforeScreenshot(config, callback)
    })

    Cypress.primaryOriginCommunicator.on('url:changed', ({ url }) => {
      this.localBus.emit('url:changed', url)
    })

    Cypress.primaryOriginCommunicator.on('after:screenshot', handleAfterScreenshot)

    Cypress.primaryOriginCommunicator.on('log:added', (attrs) => {
      // If the test is over and the user enters interactive snapshot mode, do not add cross origin logs to the test runner.
      if (Cypress.state('test')?.final) return

      // Create a new local log representation of the cross origin log.
      // It will be attached to the current command.
      // We also keep a reference to it to update it in the future.
      crossOriginLogs[attrs.id] = Cypress.log(attrs)
    })

    Cypress.primaryOriginCommunicator.on('log:changed', (attrs) => {
      // Retrieve the referenced log and update it.
      const log = crossOriginLogs[attrs.id]

      // this will trigger a log changed event for the log itself.
      log?.set(attrs)
    })

    // This message comes from the AUT, not the spec bridge.
    // This is called in the event that cookies are set in a cross origin AUT prior to attaching a spec bridge.
    Cypress.primaryOriginCommunicator.on('aut:set:cookie', ({ cookie, href }, _origin, source) => {
      const { superDomain } = Cypress.Location.create(href)
      const automationCookie = Cypress.Cookies.toughCookieToAutomationCookie(Cypress.Cookies.parse(cookie), superDomain)

      Cypress.automation('set:cookie', automationCookie).then(() => {
        // It's possible the source has already unloaded before this event has been processed.
        source?.postMessage({ event: 'cross:origin:aut:set:cookie' }, '*')
      })
      .catch(() => {
      // unlikely there will be errors, but ignore them in any case, since
      // they're not user-actionable
      })
    })

    // This message comes from the AUT, not the spec bridge.
    // This is called in the event that cookies are retrieved in a cross origin AUT prior to attaching a spec bridge.
    Cypress.primaryOriginCommunicator.on('aut:get:cookie', async ({ href }, _origin, source) => {
      const { superDomain } = Cypress.Location.create(href)

      const cookies = await Cypress.automation('get:cookies', { superDomain })

      // It's possible the source has already unloaded before this event has been processed.
      source?.postMessage({ event: 'cross:origin:aut:get:cookie', cookies }, '*')
    })

    // The window.top should not change between test reloads, and we only need to bind the message event when Cypress is recreated
    // Forward all message events to the current instance of the multi-origin communicator
    if (!window.top) throw new Error('missing window.top in event-manager')

    /**
     * NOTE: Be sure to remove the cross origin onMessage bus to make sure the communicator doesn't live on inside a closure and cause tied up events.
     *
     * This is applicable when a user navigates away from the runner and into the "specs" menu or otherwise,
     * and the EventManager is recreated. This is the main reason this reference is scoped to the file and NOT the instance.
     *
     * This is also applicable when a user changes their spec file and hot reloads their spec, in which case we need to rebind onMessage
     * with the newly creates Cypress.primaryOriginCommunicator
     */
    window?.top?.removeEventListener('message', crossOriginOnMessageRef, false)
    crossOriginOnMessageRef = ({ data, source }) => {
      Cypress?.primaryOriginCommunicator.onMessage({ data, source })

      return undefined
    }

    window.top.addEventListener('message', crossOriginOnMessageRef, false)
  }

  _runDriver (runState: RunState, testState: CachedTestState) {
    performance.mark('run-s')
    Cypress.run(testState, () => {
      performance.mark('run-e')
      performance.measure('run', 'run-s', 'run-e')
    })

    const hasRunnableId = !!this.studioStore.testId || !!this.studioStore.suiteId

    this.reporterBus.emit('reporter:start', {
      startTime: Cypress.runner.getStartTime(),
      numPassed: runState.passed,
      numFailed: runState.failed,
      numPending: runState.pending,
      autoScrollingEnabled: runState.autoScrollingEnabled,
      isSpecsListOpen: runState.isSpecsListOpen,
      scrollTop: runState.scrollTop,
      studioActive: hasRunnableId,
    } as ReporterStartInfo)
  }

  stop () {
    this.localBus.removeAllListeners()
    this.ws.off()
  }

  async teardown (state: MobxRunnerStore, isRerun = false) {
    if (!Cypress) {
      return
    }

    state.setIsLoading(true)

    if (!isRerun) {
      // only clear test state when a new spec is selected
      Cypress.backend('reset:cached:test:state')
    }

    // when we are re-running we first need to stop cypress always
    Cypress.stop()
    // Clean up the primary communicator to prevent possible memory leaks / dangling references before the Cypress instance is destroyed.
    Cypress.primaryOriginCommunicator.removeAllListeners()
    // clean up the cross origin logs in memory to prevent dangling references as the log objects themselves at this point will no longer be needed.
    crossOriginLogs = {}

    this.studioStore.setInactive()
  }

  resetReporter () {
    return new Bluebird((resolve) => {
      this.reporterBus.once('reporter:restarted', resolve)
      this.reporterBus.emit('reporter:restart:test:run')
    })
  }

  async rerunSpec () {
    if (!this || !Cypress) {
      // if the tests have been reloaded then there is nothing to rerun
      return
    }

    await this.resetReporter()

    // this probably isn't 100% necessary since Cypress will fall out of scope
    // but we want to be aggressive here and force GC early and often
    Cypress.removeAllListeners()

    this.localBus.emit('restart')
  }

  _interceptStudio (displayProps) {
    if (this.studioStore.isActive) {
      displayProps.hookId = this.studioStore.hookId

      if (displayProps.name === 'visit' && displayProps.state === 'failed') {
        this.studioStore.testFailed()
        this.reporterBus.emit('test:set:state', this.studioStore.testError, noop)
      }
    }

    return displayProps
  }

  _studioCopyToClipboard (cb) {
    this.ws.emit('studio:get:commands:text', this.studioStore.logs, (commandsText) => {
      this.studioStore.copyToClipboard(commandsText)
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

  notifyCrossOriginBridgeReady (origin) {
    // Any multi-origin event appends the origin as the third parameter and we do the same here for this short circuit
    Cypress.primaryOriginCommunicator.emit('bridge:ready', undefined, origin)
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

  // useful for testing
  _testingOnlySetCypress (cypress: any) {
    Cypress = cypress
  }
}
