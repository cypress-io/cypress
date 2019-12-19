/* eslint-disable
    default-case,
    no-unused-vars,
    prefer-rest-params,
    prefer-spread,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
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

const proxies = {
  runner: 'getStartTime getTestsState getEmissions setNumLogs countByTestState getDisplayPropsForLog getConsolePropsForLogById getSnapshotPropsForLogById getErrorByTestId setStartTime resumeAtTest normalizeAll'.split(' '),
  cy: 'detachDom getStyles'.split(' '),
}

const jqueryProxyFn = function () {
  if (!this.cy) {
    $utils.throwErrByPath('miscellaneous.no_cy')
  }

  return this.cy.$$.apply(this.cy, arguments)
}

_.extend(jqueryProxyFn, $)

// provide the old interface and
// throw a deprecation message
$Log.command = () => {
  return $utils.throwErrByPath('miscellaneous.command_log_renamed')
}

const throwDeprecatedCommandInterface = function (key, method) {
  const signature = (() => {
    switch (method) {
      case 'addParentCommand':
        return `'${key}', function(){...}`
      case 'addChildCommand':
        return `'${key}', { prevSubject: true }, function(){...}`
      case 'addDualCommand':
        return `'${key}', { prevSubject: 'optional' }, function(){...}`
    }
  })()

  return $utils.throwErrByPath('miscellaneous.custom_command_interface_changed', {
    args: { method, signature },
  })
}

const throwPrivateCommandInterface = (method) => {
  return $utils.throwErrByPath('miscellaneous.private_custom_command_interface', {
    args: { method },
  })
}

class $Cypress {
  static initClass () {
    this.prototype.$ = jqueryProxyFn

    // attach to $Cypress to access
    // all of the constructors
    // to enable users to monkeypatch
    this.prototype.$Cypress = $Cypress
    this.prototype.Cy = $Cy
    this.prototype.Chainer = $Chainer
    this.prototype.Cookies = $Cookies
    this.prototype.Command = $Command
    this.prototype.Commands = $Commands
    this.prototype.dom = $dom
    this.prototype.errorMessages = $errorMessages
    this.prototype.Keyboard = $Keyboard
    this.prototype.Location = $Location
    this.prototype.Log = $Log
    this.prototype.LocalStorage = $LocalStorage
    this.prototype.Mocha = $Mocha
    this.prototype.Mouse = $Mouse
    this.prototype.Runner = $Runner
    this.prototype.Server = $Server
    this.prototype.Screenshot = $Screenshot
    this.prototype.SelectorPlayground = $SelectorPlayground
    this.prototype.utils = $utils
    this.prototype._ = _
    this.prototype.moment = moment
    this.prototype.Blob = blobUtil
    this.prototype.Promise = Promise
    this.prototype.minimatch = minimatch
    this.prototype.sinon = sinon
    this.prototype.lolex = lolex

    // proxy all of the methods in proxies
    // to their corresponding objects
    _.each(proxies, (methods, key) => {
      return _.each(methods, (method) => {
        return $Cypress.prototype[method] = function () {
          const prop = this[key]

          return prop && prop[method].apply(prop, arguments)
        }
      })
    })
  }
  constructor (config = {}) {
    this.cy = null
    this.chai = null
    this.mocha = null
    this.runner = null
    this.Commands = null
    this._RESUMED_AT_TEST = null

    this.events = $Events.extend(this)

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

    // set domainName but allow us to turn
    // off this feature in testing
    let d

    d = config.remote != null ? config.remote.domainName : undefined

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

    const { env, remote } = config

    config = _.omit(config, 'env', 'remote', 'resolved', 'scaffoldedFiles', 'javascripts', 'state')

    this.state = $SetterGetter.create({})
    this.config = $SetterGetter.create(config)
    this.env = $SetterGetter.create(env)

    this.Cookies = $Cookies.create(config.namespace, d)

    return this.action('cypress:config', config)
  }

  initialize ($autIframe) {
    // push down the options
    // to the runner
    this.mocha.options(this.runner)

    return this.cy.initialize($autIframe)
  }

  run (fn) {
    if (!this.runner) {
      $utils.throwErrByPath('miscellaneous.no_runner')
    }

    return this.runner.run(fn)
  }

  // onSpecWindow is called as the spec window
  // is being served but BEFORE any of the actual
  // specs or support files have been downloaded
  // or parsed. we have not received any custom commands
  // at this point
  onSpecWindow (specWindow) {
    const logFn = (...args) => {
      return this.log.apply(this, args)
    }

    // create cy and expose globally
    this.cy = (window.cy = $Cy.create(specWindow, this, this.Cookies, this.state, this.config, logFn))
    this.isCy = this.cy.isCy
    this.log = $Log.create(this, this.cy, this.state, this.config)
    this.mocha = $Mocha.create(specWindow, this)
    this.runner = $Runner.create(specWindow, this.mocha, this, this.cy)

    // wire up command create to cy
    this.Commands = $Commands.create(this, this.cy, this.state, this.config)

    this.events.proxyTo(this.cy)

    return null
  }

  action (eventName, ...args) {
    // normalizes all the various ways
    // other objects communicate intent
    // and 'action' to Cypress
    switch (eventName) {
      case 'cypress:stop':
        return this.emit('stop')

      case 'cypress:config':
        return this.emit('config', args[0])

      case 'runner:start':
        // mocha runner has begun running the tests
        this.emit('run:start')

        if (this._RESUMED_AT_TEST) {
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

      case 'runner:set:runnable':
        // when there is a hook / test (runnable) that
        // is about to be invoked
        return this.cy.setRunnable(...args)

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

      case 'runner:fail':
        // mocha runner calculated a failure
        if (this.config('isTextTerminal')) {
          return this.emit('mocha', 'fail', ...args)
        }

        break

      case 'mocha:runnable:run':
        return this.runner.onRunnableRun(...args)

      case 'runner:test:before:run':
        // get back to a clean slate
        this.cy.reset()

        return this.emit('test:before:run', ...args)

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
    }
  }

  backend (eventName, ...args) {
    return new Promise((resolve, reject) => {
      const fn = function (reply) {
        let e

        e = reply.error

        if (e) {
          // clone the error object
          // and set stack cleaned
          // to prevent bluebird from
          // attaching long stace traces
          // which otherwise make this err
          // unusably long
          const err = $utils.cloneErr(e)

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
        let e

        e = reply.error

        if (e) {
          const err = $utils.cloneErr(e)

          err.automation = true

          return reject(err)
        }

        return resolve(reply.response)
      }

      return this.emit('automation:request', eventName, ...args, fn)
    })
  }

  stop () {
    this.runner.stop()
    this.cy.stop()

    return this.action('cypress:stop')
  }

  addChildCommand (key, fn) {
    return throwDeprecatedCommandInterface(key, 'addChildCommand')
  }

  addParentCommand (key, fn) {
    return throwDeprecatedCommandInterface(key, 'addParentCommand')
  }

  addDualCommand (key, fn) {
    return throwDeprecatedCommandInterface(key, 'addDualCommand')
  }

  addAssertionCommand (key, fn) {
    return throwPrivateCommandInterface('addAssertionCommand')
  }

  addUtilityCommand (key, fn) {
    return throwPrivateCommandInterface('addUtilityCommand')
  }

  static create (config) {
    return new $Cypress(config)
  }
}
$Cypress.initClass()

// attaching these so they are accessible
// via the runner + integration spec helper
$Cypress.$ = $
$Cypress.dom = $dom

module.exports = $Cypress
