import _ from 'lodash'
import $ from 'jquery'
import * as blobUtil from 'blob-util'
import minimatch from 'minimatch'
import Promise from 'bluebird'
import sinon from 'sinon'
import fakeTimers from '@sinonjs/fake-timers'
import debugFn from 'debug'

import browserInfo from './cypress/browser'
import $scriptUtils from './cypress/script_utils'
import $sourceMapUtils from './cypress/source_map_utils'

import $Commands from './cypress/commands'
import { $Cy } from './cypress/cy'
import $dom from './dom'
import $Downloads from './cypress/downloads'
import $ensure from './cypress/ensure'
import $errorMessages from './cypress/error_messages'
import $errUtils from './cypress/error_utils'
import { create as createLogFn, LogUtils } from './cypress/log'
import $LocalStorage from './cypress/local_storage'
import $Mocha from './cypress/mocha'
import { create as createMouse } from './cy/mouse'
import $Runner from './cypress/runner'
import $Screenshot from './cypress/screenshot'
import $SelectorPlayground from './cypress/selector_playground'
import $Server from './cypress/server'
import $SetterGetter from './cypress/setter_getter'
import { validateConfig } from './util/config'
import $utils from './cypress/utils'

import { $Chainer } from './cypress/chainer'
import { $Cookies, ICookies } from './cypress/cookies'
import { $Command } from './cypress/command'
import { $Location } from './cypress/location'
import ProxyLogging from './cypress/proxy-logging'
import type { StateFunc } from './cypress/state'

import * as $Events from './cypress/events'
import $Keyboard from './cy/keyboard'
import * as resolvers from './cypress/resolvers'
import { PrimaryOriginCommunicator, SpecBridgeCommunicator } from './cross-origin/communicator'
import { setupAutEventHandlers } from './cypress/aut_event_handlers'

import type { CachedTestState } from '@packages/types'
import * as cors from '@packages/network/lib/cors'
import { setSpecContentSecurityPolicy } from './util/privileged_channel'

import { telemetry } from '@packages/telemetry/src/browser'

const debug = debugFn('cypress:driver:cypress')

declare global {
  interface Window {
    __cySkipValidateConfig: boolean
    Cypress: Cypress.Cypress
    Runner: any
    cy: Cypress.cy
    // eval doesn't exist on the built-in Window type for some reason
    eval (expression: string): any
  }
}

const jqueryProxyFn = function (...args) {
  if (!this.cy) {
    $errUtils.throwErrByPath('miscellaneous.no_cy')
  }

  return this.cy.$$.apply(this.cy, args)
}

const throwPrivateCommandInterface = (method) => {
  $errUtils.throwErrByPath('miscellaneous.private_custom_command_interface', {
    args: { method },
  })
}

interface BackendError extends Error {
  __stackCleaned__: boolean
  backend: boolean
}

interface AutomationError extends Error {
  automation: boolean
}

// Are we running Cypress in Cypress? (Used for E2E Testing for Cypress in Cypress only)
const isCypressInCypress = document.defaultView !== top

class $Cypress {
  cy: any
  chai: any
  mocha: any
  runner: any
  downloads: any
  Commands: any
  $autIframe: any
  onSpecReady: any
  events: any
  $: any
  arch: any
  spec: any
  version: any
  browser: any
  platform: any
  testingType: any
  state!: StateFunc
  originalConfig: any
  config: any
  env: any
  getTestRetries: any
  Cookies!: ICookies
  ProxyLogging: any
  _onInitialize: any
  isCy: any
  log: any
  isBrowser: any
  browserMajorVersion: any
  emit: any
  emitThen: any
  emitMap: any
  primaryOriginCommunicator: PrimaryOriginCommunicator
  specBridgeCommunicator: SpecBridgeCommunicator
  isCrossOriginSpecBridge: boolean
  on: any

  // attach to $Cypress to access
  // all of the constructors
  // to enable users to monkeypatch
  $Cypress = $Cypress
  Cy = $Cy
  Chainer = $Chainer
  Command = $Command
  dom = $dom
  ensure = $ensure
  errorMessages = $errorMessages
  Keyboard = $Keyboard
  Location = $Location
  Log = LogUtils
  LocalStorage = $LocalStorage
  Mocha = $Mocha
  resolveWindowReference = resolvers.resolveWindowReference
  resolveLocationReference = resolvers.resolveLocationReference
  Mouse = {
    create: createMouse,
  }

  Runner = $Runner
  Server = $Server
  Screenshot = $Screenshot
  SelectorPlayground = $SelectorPlayground
  utils = $utils
  _ = _
  Blob = blobUtil
  Buffer = Buffer
  Promise = Promise
  minimatch = minimatch
  sinon = sinon
  lolex = fakeTimers

  static $: any
  static utils: any

  constructor () {
    this.cy = null
    this.chai = null
    this.mocha = null
    this.runner = null
    this.downloads = null
    this.Commands = null
    this.$autIframe = null
    this.onSpecReady = null
    this.primaryOriginCommunicator = new PrimaryOriginCommunicator()
    this.specBridgeCommunicator = new SpecBridgeCommunicator()
    this.isCrossOriginSpecBridge = false

    this.events = $Events.extend(this)
    this.$ = jqueryProxyFn.bind(this)

    setupAutEventHandlers(this)

    _.extend(this.$, $)
  }

  configure (config: Record<string, any> = {}) {
    const domainName = config.remote ? config.remote.domainName : undefined

    // set domainName but allow us to turn
    // off this feature in testing
    const shouldInjectDocumentDomain = cors.shouldInjectDocumentDomain(window.location.origin, {
      skipDomainInjectionForDomains: config.experimentalSkipDomainInjection,
    })

    if (domainName && config.testingType === 'e2e' && shouldInjectDocumentDomain) {
      document.domain = domainName
    }

    // a few static props for the host OS, browser
    // and the current version of Cypress
    this.arch = config.arch
    this.spec = config.spec
    this.version = config.version
    this.browser = config.browser
    this.platform = config.platform
    this.testingType = config.testingType

    // normalize this into boolean
    config.isTextTerminal = !!config.isTextTerminal

    // we assume we're interactive based on whether or
    // not we're in a text terminal, but we keep this
    // as a separate property so we can potentially
    // slice up the behavior
    config.isInteractive = !config.isTextTerminal

    // true if this Cypress belongs to a cross origin spec bridge
    this.isCrossOriginSpecBridge = config.isCrossOriginSpecBridge || false

    // enable long stack traces when
    // we not are running headlessly
    // for debuggability but disable
    // them when running headlessly for
    // performance since users cannot
    // interact with the stack traces
    Promise.config({
      longStackTraces: config.isInteractive,
    })

    // TODO: env is unintentionally preserved between soft reruns unlike config.
    // change this in the NEXT_BREAKING
    const { env } = config

    config = _.omit(config, 'env', 'rawJson', 'remote', 'resolved', 'scaffoldedFiles', 'state', 'testingType', 'isCrossOriginSpecBridge')

    _.extend(this, browserInfo(config))

    this.state = $SetterGetter.create({}) as unknown as StateFunc

    /*
     * As part of the Detached DOM effort, we're changing the way subjects are determined in Cypress.
     * While we usually consider cy.state() to be internal, in the case of cy.state('subject') and cy.state('withinSubject'),
     * cypress-testing-library, one of our most popular plugins, relies on them.
     * https://github.com/testing-library/cypress-testing-library/blob/1af9f2f28b2ca62936da8a8acca81fc87e2192f7/src/utils.js#L9
     *
     * Therefore, we've added these shims to continue to support them. The library is actively maintained, so this
     * shouldn't need to stick around too long (written 07/22).
     */
    Object.defineProperty(this.state(), 'subject', {
      get: () => {
        $errUtils.warnByPath('subject.state_subject_deprecated')

        return this.cy.subject()
      },
    })

    Object.defineProperty(this.state(), 'withinSubject', {
      get: () => {
        $errUtils.warnByPath('subject.state_withinsubject_deprecated')

        return this.cy.getSubjectFromChain(this.cy.state('withinSubjectChain'))
      },
    })

    this.originalConfig = _.cloneDeep(config)
    this.config = $SetterGetter.create(config, (config) => {
      const skipConfigOverrideValidation = this.isCrossOriginSpecBridge ? window.__cySkipValidateConfig : window.top!.__cySkipValidateConfig

      return validateConfig(this.state, config, skipConfigOverrideValidation)
    })

    this.env = $SetterGetter.create(env)
    this.getTestRetries = function () {
      const testRetries = this.config('retries')

      if (_.isNumber(testRetries)) {
        return testRetries
      }

      if (_.isObject(testRetries)) {
        const retriesAsNumberOrBoolean = testRetries[this.config('isInteractive') ? 'openMode' : 'runMode']

        // If experimentalRetries are configured, an experimentalStrategy is present, and the retries configured is a boolean
        // then we need to set the mocha '_retries' to 'maxRetries' present in the 'experimentalOptions' configuration.
        if (testRetries['experimentalStrategy'] && _.isBoolean(retriesAsNumberOrBoolean) && retriesAsNumberOrBoolean) {
          return testRetries['experimentalOptions'].maxRetries
        }

        // Otherwise, this is a number and falls back to default
        return retriesAsNumberOrBoolean
      }

      return null
    }

    this.Cookies = $Cookies.create(config.namespace, domainName)

    // TODO: Remove this after $Events functions are added to $Cypress.
    // @ts-ignore
    this.ProxyLogging = new ProxyLogging(this)

    return this.action('cypress:config', config)
  }

  initialize ({ $autIframe, onSpecReady }) {
    this.$autIframe = $autIframe
    this.onSpecReady = onSpecReady
    if (this._onInitialize) {
      this._onInitialize()
      this._onInitialize = undefined
    }
  }

  run (cachedTestState: CachedTestState, fn) {
    if (!this.runner) {
      $errUtils.throwErrByPath('miscellaneous.no_runner')
    }

    this.state(cachedTestState)

    return this.runner.run(fn)
  }

  // Method to manually re-execute Runner (usually within $autIframe)
  // used mainly by Component Testing
  restartRunner () {
    if (!window.top!.Cypress) {
      throw Error('Cannot re-run spec without Cypress')
    }

    // MobX state is only available on the Runner instance
    // which is attached to the top level `window`
    // We avoid infinite restart loop by checking if not in a loading state.
    if (!window.top!.Runner.state.isLoading) {
      window.top!.Runner.emit('restart')
    }
  }

  // onSpecWindow is called as the spec window
  // is being served but BEFORE any of the actual
  // specs or support files have been downloaded
  // or parsed. we have not received any custom commands
  // at this point
  onSpecWindow (specWindow: Window, scripts) {
    // create cy and expose globally
    this.cy = new $Cy(specWindow, this, this.Cookies, this.state, this.config)
    window.cy = this.cy
    this.isCy = this.cy.isCy
    this.log = createLogFn(this, this.cy, this.state, this.config)
    this.mocha = $Mocha.create(specWindow, this, this.config)
    this.runner = $Runner.create(specWindow, this.mocha, this, this.cy, this.state)
    this.downloads = $Downloads.create(this)

    // wire up command create to cy
    this.Commands = $Commands.create(this, this.cy, this.state, this.config)

    this.events.proxyTo(this.cy)

    $scriptUtils.runScripts({
      browser: this.config('browser'),
      scripts,
      specWindow,
      testingType: this.testingType,
    })
    .then(() => {
      if (this.testingType === 'e2e') {
        return setSpecContentSecurityPolicy(specWindow)
      }
    })
    .catch((error) => {
      this.runner.onSpecError('error')({ error })
    })
    .then(() => {
      return (new Promise((resolve) => {
        if (this.$autIframe) {
          resolve()
        } else {
          // block initialization if the iframe has not been created yet
          // Used in CT when async chunks for plugins take their time to download/parse
          this._onInitialize = resolve
        }
      }))
    })
    .then(() => {
      this.cy.initialize(this.$autIframe)
      this.onSpecReady()
    })
  }

  maybeEmitCypressInCypress (...args: unknown[]) {
    // emit an event if we are running a Cypress in Cypress E2E Test.
    // used to assert the runner (mocha) is emitting the expected
    // events/payload.
    if (!isCypressInCypress) {
      return
    }

    this.emit('cypress:in:cypress:runner:event', ...args)
  }

  action (eventName, ...args) {
    // normalizes all the various ways
    // other objects communicate intent
    // and 'action' to Cypress
    debug(eventName)
    switch (eventName) {
      case 'recorder:frame':
        return this.emit('recorder:frame', args[0])

      case 'cypress:stop':
        return this.emit('stop')

      case 'cypress:config':
        // emit config event used to:
        //   - trigger iframe viewport update
        return this.emit('config', args[0])

      case 'runner:start':
        // mocha runner has begun running the tests
        this.emit('run:start')

        if (this.runner.getResumedAtTestIndex() !== null) {
          return
        }

        this.maybeEmitCypressInCypress('mocha', 'start', args[0])

        if (this.config('isTextTerminal')) {
          return this.emit('mocha', 'start', args[0])
        }

        break

      case 'runner:end':
        $sourceMapUtils.destroySourceMapConsumers()

        telemetry.getSpan('cypress:app')?.end()

        // mocha runner has finished running the tests
        // TODO: it would be nice to await this emit before preceding.
        this.emit('run:end')

        this.maybeEmitCypressInCypress('mocha', 'end', args[0])

        if (this.config('isTextTerminal')) {
          return this.emit('mocha', 'end', args[0])
        }

        break

      case 'runner:suite:start':
        // mocha runner started processing a suite
        this.maybeEmitCypressInCypress('mocha', 'suite', ...args)

        if (this.config('isTextTerminal')) {
          return this.emit('mocha', 'suite', ...args)
        }

        break
      case 'runner:suite:end':
        // mocha runner finished processing a suite
        this.maybeEmitCypressInCypress('mocha', 'suite end', ...args)

        if (this.config('isTextTerminal')) {
          return this.emit('mocha', 'suite end', ...args)
        }

        break
      case 'runner:hook:start':
        // mocha runner started processing a hook

        this.maybeEmitCypressInCypress('mocha', 'hook', ...args)

        if (this.config('isTextTerminal')) {
          return this.emit('mocha', 'hook', ...args)
        }

        break

      case 'runner:hook:end':
        // mocha runner finished processing a hook
        this.maybeEmitCypressInCypress('mocha', 'hook end', ...args)

        if (this.config('isTextTerminal')) {
          return this.emit('mocha', 'hook end', ...args)
        }

        break

      case 'runner:test:start':
        // mocha runner started processing a hook
        this.maybeEmitCypressInCypress('mocha', 'test', ...args)

        if (this.config('isTextTerminal')) {
          return this.emit('mocha', 'test', ...args)
        }

        break

      case 'runner:test:end':
        this.maybeEmitCypressInCypress('mocha', 'test end', ...args)

        if (this.config('isTextTerminal')) {
          return this.emit('mocha', 'test end', ...args)
        }

        break

      case 'runner:pass':
        // mocha runner calculated a pass
        // this is delayed from when mocha would normally fire it
        // since we fire it after all afterEach hooks have ran
        this.maybeEmitCypressInCypress('mocha', 'pass', ...args)

        if (this.config('isTextTerminal')) {
          return this.emit('mocha', 'pass', ...args)
        }

        break

      case 'runner:pending':
        // mocha runner calculated a pending test
        this.maybeEmitCypressInCypress('mocha', 'pending', ...args)

        if (this.config('isTextTerminal')) {
          return this.emit('mocha', 'pending', ...args)
        }

        break

      case 'runner:fail': {
        this.maybeEmitCypressInCypress('mocha', 'fail', ...args)

        if (this.config('isTextTerminal')) {
          return this.emit('mocha', 'fail', ...args)
        }

        break
      }
      // retry event only fired in mocha version 6+
      // https://github.com/mochajs/mocha/commit/2a76dd7589e4a1ed14dd2a33ab89f182e4c4a050
      case 'runner:retry': {
        // mocha runner calculated a pass
        this.maybeEmitCypressInCypress('mocha', 'retry', ...args)

        if (this.config('isTextTerminal')) {
          this.emit('mocha', 'retry', ...args)
        }

        break
      }

      case 'mocha:runnable:run':
        return this.runner.onRunnableRun(...args)

      case 'runner:test:before:run':
        this.maybeEmitCypressInCypress('mocha', 'test:before:run', args[0])

        if (this.config('isTextTerminal')) {
          // needed for handling test retries
          this.emit('mocha', 'test:before:run', args[0])
        }

        this.emit('test:before:run', ...args)
        break

      case 'runner:test:before:run:async':
        this.maybeEmitCypressInCypress('mocha', 'test:before:run:async', args[0])

        // TODO: handle timeouts here? or in the runner?
        return this.emitThen('test:before:run:async', ...args)

      case 'runner:test:before:after:run:async':
        this.maybeEmitCypressInCypress('mocha', 'test:before:after:run:async', args[0], args[2])

        return this.emitThen('test:before:after:run:async', ...args)

      case 'runner:test:after:run:async':
        this.maybeEmitCypressInCypress('mocha', 'test:after:run:async', args[0])

        return this.emitThen('test:after:run:async', ...args)

      case 'runner:runnable:after:run:async':
        return this.emitThen('runnable:after:run:async', ...args)

      case 'runner:test:after:run':
        this.runner.cleanupQueue(this.config('numTestsKeptInMemory'))

        // this event is how the reporter knows how to display
        // stats and runnable properties such as errors
        this.emit('test:after:run', ...args)
        this.maybeEmitCypressInCypress('mocha', 'test:after:run', args[0])

        if (this.config('isTextTerminal')) {
          // needed for calculating wallClockDuration
          // and the timings of after + afterEach hooks
          return this.emit('mocha', 'test:after:run', args[0])
        }

        break
      case 'cy:before:all:screenshots':
        return this.emit('before:all:screenshots', ...args)

      case 'cy:before:screenshot':
        return this.emit('before:screenshot', ...args)

      case 'cy:after:screenshot':
        return this.emit('after:screenshot', ...args)

      case 'cy:after:all:screenshots':
        return this.emit('after:all:screenshots', ...args)

      case 'command:log:added':
        this.runner?.addLog(args[0], this.config('isInteractive'))

        return this.emit('log:added', ...args)

      case 'command:log:changed':
        // Cypress logs will only trigger an update every 4 ms so there is a
        // chance the runner has been torn down when the update is triggered.
        this.runner?.addLog(args[0], this.config('isInteractive'))

        return this.emit('log:changed', ...args)

      case 'cy:fail':
        // comes from cypress errors fail()
        return this.emitMap('fail', ...args)

      case 'cy:stability:changed':
        return this.emit('stability:changed', ...args)

      case 'cy:paused':
        return this.emit('paused', ...args)

      case 'cy:canceled':
        return this.emit('canceled')

      case 'cy:visit:failed':
        return this.emit('visit:failed', args[0])

      case 'cy:visit:blank':
        return this.emitThen('visit:blank', args[0])

      case 'cy:viewport:changed':
        return this.emit('viewport:changed', ...args)

      case 'cy:command:start':
        return this.emit('command:start', ...args)

      case 'cy:command:start:async':
        return this.emitThen('command:start:async', ...args)

      case 'cy:command:end':
        return this.emit('command:end', ...args)

      case 'cy:command:failed':
        return this.emit('command:failed', ...args)

      case 'cy:skipped:command:end':
        return this.emit('skipped:command:end', ...args)

      case 'cy:command:retry':
        return this.emit('command:retry', ...args)

      case 'cy:command:enqueued':
        return this.emit('command:enqueued', args[0])

      case 'cy:command:queue:before:end':
        return this.emit('command:queue:before:end')

      case 'cy:command:queue:end':
        return this.emit('command:queue:end')

      case 'cy:enqueue:command':
        return this.emit('enqueue:command', ...args)

      case 'cy:url:changed':
        return this.emit('url:changed', args[0])

      case 'cy:collect:run:state':
        return this.emitThen('collect:run:state')

      case 'cy:scrolled':
        return this.emit('scrolled', ...args)

      case 'cy:snapshot':
        return this.emit('snapshot', ...args)

      case 'cy:protocol-snapshot':
        return this.emit('cy:protocol-snapshot', ...args)

      case 'cy:before:stability:release':
        return this.emitThen('before:stability:release')

      case 'app:uncaught:exception':
        return this.emitMap('uncaught:exception', ...args)

      case 'app:window:alert':
        return this.emit('window:alert', args[0])

      case 'app:window:confirm':
        return this.emitMap('window:confirm', args[0])

      case 'app:window:confirmed':
        return this.emit('window:confirmed', ...args)

      case 'app:page:loading':
        return this.emit('page:loading', args[0])

      case 'app:window:before:load':
        this.cy.onBeforeAppWindowLoad(args[0])

        return this.emit('window:before:load', args[0])

      case 'app:navigation:changed':
        return this.emit('navigation:changed', ...args)

      case 'app:download:received':
        return this.emit('download:received')

      case 'app:form:submitted':
        return this.emit('form:submitted', args[0])

      case 'app:window:load':
        this.emit('internal:window:load', {
          type: 'same:origin',
          window: args[0],
          url: args[1],
        })

        return this.emit('window:load', args[0])

      case 'app:window:before:unload':
        return this.emit('window:before:unload', args[0])

      case 'app:window:unload':
        return this.emit('window:unload', args[0])

      case 'app:timers:reset':
        return this.emitThen('app:timers:reset', ...args)

      case 'app:timers:pause':
        return this.emitThen('app:timers:pause', ...args)

      case 'app:css:modified':
        return this.emit('css:modified', args[0])

      case 'spec:script:error':
        return this.emit('script:error', ...args)

      default:
        return
    }
  }

  backend (eventName, ...args) {
    return new Promise((resolve, reject) => {
      const fn = function (reply) {
        const e = reply.error

        if (e) {
          // clone the error object
          // and set stack cleaned
          // to prevent bluebird from
          // attaching long stack traces
          // which otherwise make this err
          // unusably long
          const err = $errUtils.makeErrFromObj(e) as BackendError

          err.__stackCleaned__ = true
          err.backend = true

          return reject(err)
        }

        return resolve(reply.response)
      }

      return this.emit('backend:request', eventName, ...args, fn)
    })
  }

  automation (eventName, ...args) {
    // wrap action in promise
    return new Promise((resolve, reject) => {
      const fn = function (reply) {
        const e = reply.error

        if (e) {
          const err = $errUtils.makeErrFromObj(e) as AutomationError

          err.automation = true

          return reject(err)
        }

        return resolve(reply.response)
      }

      return this.emit('automation:request', eventName, ...args, fn)
    })
  }

  stop () {
    if (!this.runner) {
      // the tests have been reloaded
      return
    }

    this.runner.stop()
    this.cy.stop()

    return this.action('cypress:stop')
  }

  addAssertionCommand () {
    return throwPrivateCommandInterface('addAssertionCommand')
  }

  addUtilityCommand () {
    return throwPrivateCommandInterface('addUtilityCommand')
  }

  // Cypress.require() is only valid inside the cy.origin() callback
  require () {
    $errUtils.throwErrByPath('require.invalid_outside_origin')
  }

  get currentTest () {
    const r = this.cy.state('runnable')

    if (!r) {
      return null
    }

    // if we're in a hook, ctx.currentTest is defined
    // if we're in test body, r is the currentTest
    /**
     * @type {Mocha.Test}
     */
    const currentTestRunnable = r.ctx.currentTest || r

    return {
      title: currentTestRunnable.title,
      titlePath: currentTestRunnable.titlePath(),
    }
  }

  get currentRetry (): number {
    const ctx = this.cy.state('runnable').ctx

    return ctx?.currentTest?._currentRetry || ctx?.test?._currentRetry
  }

  static create (config: Record<string, any>) {
    const cypress = new $Cypress()

    cypress.configure(config)

    return cypress
  }
}

// attaching these so they are accessible
// via the runner + integration spec helper
$Cypress.$ = $
$Cypress.utils = $utils
export default $Cypress

export type ICypress = ReturnType<typeof $Cypress.create>
