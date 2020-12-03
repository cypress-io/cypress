const _ = require('lodash')
const $ = require('jquery')
const blobUtil = require('blob-util')
const minimatch = require('minimatch')
const moment = require('moment')
const Promise = require('bluebird')
const sinon = require('sinon')
const lolex = require('lolex')

const $dom = require('./dom')
const $errorMessages = require('./cypress/error_messages')
const $Chainer = require('./cypress/chainer')
const $Command = require('./cypress/command')
const $Commands = require('./cypress/commands')
const $Cookies = require('./cypress/cookies')
const $Cy = require('./cypress/cy')
const $Events = require('./cypress/events')
const $FirefoxForcedGc = require('./util/firefox_forced_gc')
const $Keyboard = require('./cy/keyboard')
const $SetterGetter = require('./cypress/setter_getter')
const $Log = require('./cypress/log')
const $Location = require('./cypress/location')
const $LocalStorage = require('./cypress/local_storage')
const $Mocha = require('./cypress/mocha')
const $Mouse = require('./cy/mouse')
const $Runner = require('./cypress/runner')
const $Server = require('./cypress/server')
const $Screenshot = require('./cypress/screenshot')
const $SelectorPlayground = require('./cypress/selector_playground')
const $utils = require('./cypress/utils')
const $errUtils = require('./cypress/error_utils')
const $scriptUtils = require('./cypress/script_utils')
const browserInfo = require('./cypress/browser')
const resolvers = require('./cypress/resolvers')
const debug = require('debug')('cypress:driver:cypress')

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

class $Cypress {
  constructor (config = {}) {
    this.cy = null
    this.chai = null
    this.mocha = null
    this.runner = null
    this.Commands = null
    this.$autIframe = null
    this.onSpecReady = null

    this.events = $Events.extend(this)
    this.$ = jqueryProxyFn.bind(this)

    _.extend(this.$, $)

    this.setConfig(config)
  }

  setConfig (config = {}) {
    // config.remote
    // {
    //   origin: "http://localhost:2020"
    //   domainName: "localhost"
    //   props: null
    //   strategy: "file"
    // }

    // -- or --

    // {
    //   origin: "https://foo.google.com"
    //   domainName: "google.com"
    //   strategy: "http"
    //   props: {
    //     port: 443
    //     tld: "com"
    //     domain: "google"
    //   }
    // }

    let d = config.remote ? config.remote.domainName : undefined

    // set domainName but allow us to turn
    // off this feature in testing
    if (d) {
      document.domain = d
    }

    // a few static props for the host OS, browser
    // and the current version of Cypress
    this.arch = config.arch
    this.spec = config.spec
    this.version = config.version
    this.browser = config.browser
    this.platform = config.platform

    // normalize this into boolean
    config.isTextTerminal = !!config.isTextTerminal

    // we asumme we're interactive based on whether or
    // not we're in a text terminal, but we keep this
    // as a separate property so we can potentially
    // slice up the behavior
    config.isInteractive = !config.isTextTerminal

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

    config = _.omit(config, 'env', 'remote', 'resolved', 'scaffoldedFiles', 'javascripts', 'state')

    _.extend(this, browserInfo(config))

    this.state = $SetterGetter.create({})
    this.config = $SetterGetter.create(config)
    this.env = $SetterGetter.create(env)
    this.getFirefoxGcInterval = $FirefoxForcedGc.createIntervalGetter(this)
    this.getTestRetries = function () {
      const testRetries = this.config('retries')

      if (_.isNumber(testRetries)) {
        return testRetries
      }

      if (_.isObject(testRetries)) {
        return testRetries[this.config('isInteractive') ? 'openMode' : 'runMode']
      }

      return null
    }

    this.Cookies = $Cookies.create(config.namespace, d)

    return this.action('cypress:config', config)
  }

  initialize ({ $autIframe, onSpecReady }) {
    this.$autIframe = $autIframe
    this.onSpecReady = onSpecReady
  }

  run (fn) {
    if (!this.runner) {
      $errUtils.throwErrByPath('miscellaneous.no_runner')
    }

    return this.runner.run(fn)
  }

  // onSpecWindow is called as the spec window
  // is being served but BEFORE any of the actual
  // specs or support files have been downloaded
  // or parsed. we have not received any custom commands
  // at this point
  onSpecWindow (specWindow, scripts) {
    const logFn = (...args) => {
      return this.log.apply(this, args)
    }

    // create cy and expose globally
    this.cy = $Cy.create(specWindow, this, this.Cookies, this.state, this.config, logFn)
    window.cy = this.cy
    this.isCy = this.cy.isCy
    this.log = $Log.create(this, this.cy, this.state, this.config)
    this.mocha = $Mocha.create(specWindow, this, this.config)
    this.runner = $Runner.create(specWindow, this.mocha, this, this.cy)

    // wire up command create to cy
    this.Commands = $Commands.create(this, this.cy, this.state, this.config)

    this.events.proxyTo(this.cy)

    $FirefoxForcedGc.install(this)

    $scriptUtils.runScripts(specWindow, scripts)
    .catch((err) => {
      err = $errUtils.createUncaughtException('spec', err)

      this.runner.onScriptError(err)
    })
    .then(() => {
      this.cy.initialize(this.$autIframe)

      this.onSpecReady()
    })
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
        return this.emit('config', args[0])

      case 'runner:start':
        // mocha runner has begun running the tests
        this.emit('run:start')

        if (this.runner.getResumedAtTestIndex() !== null) {
          return
        }

        if (this.config('isTextTerminal')) {
          return this.emit('mocha', 'start', args[0])
        }

        break

      case 'runner:end':
        // mocha runner has finished running the tests

        // end may have been caused by an uncaught error
        // that happened inside of a hook.
        //
        // when this happens mocha aborts the entire run
        // and does not do the usual cleanup so that means
        // we have to fire the test:after:hooks and
        // test:after:run events ourselves
        this.emit('run:end')

        if (this.config('isTextTerminal')) {
          return this.emit('mocha', 'end', args[0])
        }

        break

      case 'runner:suite:start':
        // mocha runner started processing a suite
        if (this.config('isTextTerminal')) {
          return this.emit('mocha', 'suite', ...args)
        }

        break

      case 'runner:suite:end':
        // mocha runner finished processing a suite
        if (this.config('isTextTerminal')) {
          return this.emit('mocha', 'suite end', ...args)
        }

        break

      case 'runner:hook:start':
        // mocha runner started processing a hook
        if (this.config('isTextTerminal')) {
          return this.emit('mocha', 'hook', ...args)
        }

        break

      case 'runner:hook:end':
        // mocha runner finished processing a hook
        if (this.config('isTextTerminal')) {
          return this.emit('mocha', 'hook end', ...args)
        }

        break

      case 'runner:test:start':
        // mocha runner started processing a hook
        if (this.config('isTextTerminal')) {
          return this.emit('mocha', 'test', ...args)
        }

        break

      case 'runner:test:end':
        if (this.config('isTextTerminal')) {
          return this.emit('mocha', 'test end', ...args)
        }

        break

      case 'runner:pass':
        // mocha runner calculated a pass
        // this is delayed from when mocha would normally fire it
        // since we fire it after all afterEach hooks have ran
        if (this.config('isTextTerminal')) {
          return this.emit('mocha', 'pass', ...args)
        }

        break

      case 'runner:pending':
        // mocha runner calculated a pending test
        if (this.config('isTextTerminal')) {
          return this.emit('mocha', 'pending', ...args)
        }

        break

      case 'runner:fail': {
        if (this.config('isTextTerminal')) {
          return this.emit('mocha', 'fail', ...args)
        }

        break
      }
      // retry event only fired in mocha version 6+
      // https://github.com/mochajs/mocha/commit/2a76dd7589e4a1ed14dd2a33ab89f182e4c4a050
      case 'runner:retry': {
        // mocha runner calculated a pass
        if (this.config('isTextTerminal')) {
          this.emit('mocha', 'retry', ...args)
        }

        break
      }

      case 'mocha:runnable:run':
        return this.runner.onRunnableRun(...args)

      case 'runner:test:before:run':
        // get back to a clean slate
        this.cy.reset(...args)

        if (this.config('isTextTerminal')) {
          // needed for handling test retries
          this.emit('mocha', 'test:before:run', args[0])
        }

        this.emit('test:before:run', ...args)

        break

      case 'runner:test:before:run:async':
        // TODO: handle timeouts here? or in the runner?
        return this.emitThen('test:before:run:async', ...args)

      case 'runner:runnable:after:run:async':
        return this.emitThen('runnable:after:run:async', ...args)

      case 'runner:test:after:run':
        this.runner.cleanupQueue(this.config('numTestsKeptInMemory'))

        // this event is how the reporter knows how to display
        // stats and runnable properties such as errors
        this.emit('test:after:run', ...args)

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
        this.runner.addLog(args[0], this.config('isInteractive'))

        return this.emit('log:added', ...args)

      case 'command:log:changed':
        this.runner.addLog(args[0], this.config('isInteractive'))

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

      case 'cy:viewport:changed':
        return this.emit('viewport:changed', ...args)

      case 'cy:command:start':
        return this.emit('command:start', ...args)

      case 'cy:command:end':
        return this.emit('command:end', ...args)

      case 'cy:command:retry':
        return this.emit('command:retry', ...args)

      case 'cy:command:enqueued':
        return this.emit('command:enqueued', args[0])

      case 'cy:command:queue:before:end':
        return this.emit('command:queue:before:end')

      case 'cy:command:queue:end':
        return this.emit('command:queue:end')

      case 'cy:url:changed':
        return this.emit('url:changed', args[0])

      case 'cy:next:subject:prepared':
        return this.emit('next:subject:prepared', ...args)

      case 'cy:collect:run:state':
        return this.emitThen('collect:run:state')

      case 'cy:scrolled':
        return this.emit('scrolled', ...args)

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

      case 'app:form:submitted':
        return this.emit('form:submitted', args[0])

      case 'app:window:load':
        return this.emit('window:load', args[0])

      case 'app:window:before:unload':
        return this.emit('window:before:unload', args[0])

      case 'app:window:unload':
        return this.emit('window:unload', args[0])

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
          // attaching long stace traces
          // which otherwise make this err
          // unusably long
          const err = $errUtils.makeErrFromObj(e)

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
          const err = $errUtils.makeErrFromObj(e)

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

  static create (config) {
    return new $Cypress(config)
  }
}

function wrapMoment (moment) {
  function deprecatedFunction (...args) {
    $errUtils.warnByPath('moment.deprecated')

    return moment.apply(moment, args)
  }
  // copy all existing properties from "moment" like "moment.duration"
  _.keys(moment).forEach((key) => {
    const value = moment[key]

    if (_.isFunction(value)) {
      // recursively wrap any property that can be called by the user
      // so that Cypress.moment.duration() shows deprecated message
      deprecatedFunction[key] = wrapMoment(value)
    } else {
      deprecatedFunction[key] = value
    }
  })

  return deprecatedFunction
}

// attach to $Cypress to access
// all of the constructors
// to enable users to monkeypatch
$Cypress.prototype.$Cypress = $Cypress
$Cypress.prototype.Cy = $Cy
$Cypress.prototype.Chainer = $Chainer
$Cypress.prototype.Cookies = $Cookies
$Cypress.prototype.Command = $Command
$Cypress.prototype.Commands = $Commands
$Cypress.prototype.dom = $dom
$Cypress.prototype.errorMessages = $errorMessages
$Cypress.prototype.Keyboard = $Keyboard
$Cypress.prototype.Location = $Location
$Cypress.prototype.Log = $Log
$Cypress.prototype.LocalStorage = $LocalStorage
$Cypress.prototype.Mocha = $Mocha
$Cypress.prototype.resolveWindowReference = resolvers.resolveWindowReference
$Cypress.prototype.resolveLocationReference = resolvers.resolveLocationReference
$Cypress.prototype.Mouse = $Mouse
$Cypress.prototype.Runner = $Runner
$Cypress.prototype.Server = $Server
$Cypress.prototype.Screenshot = $Screenshot
$Cypress.prototype.SelectorPlayground = $SelectorPlayground
$Cypress.prototype.utils = $utils
$Cypress.prototype._ = _
$Cypress.prototype.moment = wrapMoment(moment)
$Cypress.prototype.Blob = blobUtil
$Cypress.prototype.Promise = Promise
$Cypress.prototype.minimatch = minimatch
$Cypress.prototype.sinon = sinon
$Cypress.prototype.lolex = lolex

// attaching these so they are accessible
// via the runner + integration spec helper
$Cypress.$ = $
$Cypress.utils = $utils

module.exports = $Cypress
