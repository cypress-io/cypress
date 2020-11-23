/* eslint-disable prefer-rest-params */

const _ = require('lodash')
const $errUtils = require('./error_utils')
const { getTestFromRunnable } = require('./utils')
const $stackUtils = require('./stack_utils')

// in the browser mocha is coming back
// as window
const mocha = require('mocha')

const Mocha = mocha.Mocha != null ? mocha.Mocha : mocha
const { Test, Runner, Runnable, Hook, Suite } = Mocha

const runnerRun = Runner.prototype.run
const runnerFail = Runner.prototype.fail
const runnerRunTests = Runner.prototype.runTests
const runnableRun = Runnable.prototype.run
const runnableClearTimeout = Runnable.prototype.clearTimeout
const runnableResetTimeout = Runnable.prototype.resetTimeout
const testRetries = Test.prototype.retries
const testClone = Test.prototype.clone
const suiteAddTest = Suite.prototype.addTest
const suiteRetries = Suite.prototype.retries
const hookRetries = Hook.prototype.retries

// don't let mocha polute the global namespace
delete window.mocha
delete window.Mocha

function invokeFnWithOriginalTitle (ctx, originalTitle, mochaArgs, fn) {
  const ret = fn.apply(ctx, mochaArgs)

  ret.originalTitle = originalTitle

  return ret
}

function overloadMochaFnForConfig (fnName, specWindow) {
  const _fn = specWindow[fnName]

  const fnType = fnName === 'it' || fnName === 'specify' ? 'Test' : 'Suite'

  function overrideFn (fn) {
    specWindow[fnName] = fn()
    specWindow[fnName]['only'] = fn('only')
    specWindow[fnName]['skip'] = fn('skip')
    // override xit, xdescribe, etc
    if (specWindow[`x${fnName}`]) specWindow[`x${fnName}`] = specWindow[fnName]['skip']
  }

  overrideFn(function (subFn) {
    return function (...args) {
      /**
       * @type {Cypress.Cypress}
       */
      const Cypress = specWindow.Cypress

      const origFn = subFn ? _fn[subFn] : _fn

      if (args.length > 2 && _.isObject(args[1])) {
        const opts = _.defaults({}, args[1], {
          browser: null,
        })

        const mochaArgs = [args[0], args[2]]

        const configMatchesBrowser = opts.browser == null || Cypress.isBrowser(opts.browser, `${fnType} config value \`{ browser }\``)

        if (!configMatchesBrowser) {
          // TODO: this would mess up the dashboard since it would be registered as a new test
          const originalTitle = mochaArgs[0]

          mochaArgs[0] = `${originalTitle} (skipped due to browser)`

          // TODO: weird edge case where you have an .only but also skipped the test due to the browser
          if (subFn === 'only') {
            mochaArgs[1] = function () {
              this.skip()
            }

            return invokeFnWithOriginalTitle(this, originalTitle, mochaArgs, origFn)
          }

          return invokeFnWithOriginalTitle(this, originalTitle, mochaArgs, _fn['skip'])
        }

        const ret = origFn.apply(this, mochaArgs)

        ret.cfg = opts

        return ret
      }

      return origFn.apply(this, args)
    }
  })
}

function getInvocationDetails (specWindow, config) {
  if (specWindow.Error) {
    let stack = (new specWindow.Error()).stack

    // note: specWindow.Cypress can be undefined or null
    // if the user quickly reloads the tests multiple times

    // firefox throws a different stack than chromium
    // which includes stackframes from cypress_runner.js.
    // So we drop the lines until we get to the spec stackframe (incldues __cypress/tests)
    if (specWindow.Cypress && specWindow.Cypress.isBrowser('firefox')) {
      stack = $stackUtils.stackWithLinesDroppedFromMarker(stack, '__cypress/tests', true)
    }

    const details = $stackUtils.getSourceDetailsForFirstLine(stack, config('projectRoot'))

    return {
      details,
      stack,
    }
  }
}

function overloadMochaHook (fnName, suite, specWindow, config) {
  const _fn = suite[fnName]

  suite[fnName] = function (title, fn) {
    const _createHook = this._createHook

    this._createHook = function (title, fn) {
      const hook = _createHook.call(this, title, fn)

      let invocationStack = hook.invocationDetails?.stack

      if (!hook.invocationDetails) {
        const invocationDetails = getInvocationDetails(specWindow, config)

        hook.invocationDetails = invocationDetails.details
        invocationStack = invocationDetails.stack
      }

      if (this._condensedHooks) {
        throw $errUtils.errByPath('mocha.hook_registered_late', { hookTitle: fnName })
        .setUserInvocationStack(invocationStack)
      }

      return hook
    }

    const ret = _fn.call(this, title, fn)

    this._createHook = _createHook

    return ret
  }
}

function overloadMochaTest (suite, specWindow, config) {
  const _fn = suite.addTest

  suite.addTest = function (test) {
    if (!test.invocationDetails) {
      test.invocationDetails = getInvocationDetails(specWindow, config).details
    }

    return _fn.call(this, test)
  }
}

const ui = (specWindow, _mocha, config) => {
  // Override mocha.ui so that the pre-require event is emitted
  // with the iframe's `window` reference, rather than the parent's.
  _mocha.ui = function (name) {
    this._ui = Mocha.interfaces[name]

    if (!this._ui) {
      $errUtils.throwErrByPath('mocha.invalid_interface', { args: { name } })
    }

    this._ui = this._ui(this.suite)

    // this causes the mocha globals in the spec window to be defined
    // such as describe, it, before, beforeEach, etc
    this.suite.emit('pre-require', specWindow, null, this)

    // allow testConfigOverrides/suite-config-overrides
    // by accepting 3 arguments to it/describe/context
    overloadMochaFnForConfig('it', specWindow)
    overloadMochaFnForConfig('specify', specWindow)
    overloadMochaFnForConfig('describe', specWindow)
    overloadMochaFnForConfig('context', specWindow)

    // overload tests and hooks so that we can get the stack info
    overloadMochaHook('beforeAll', this.suite.constructor.prototype, specWindow, config)
    overloadMochaHook('beforeEach', this.suite.constructor.prototype, specWindow, config)
    overloadMochaHook('afterAll', this.suite.constructor.prototype, specWindow, config)
    overloadMochaHook('afterEach', this.suite.constructor.prototype, specWindow, config)

    overloadMochaTest(this.suite.constructor.prototype, specWindow, config)

    return this
  }

  return _mocha.ui('bdd')
}

const setMochaProps = (specWindow, _mocha, config) => {
  // Mocha is usually defined in the spec when used normally
  // in the browser or node, so we add it as a global
  // for our users too
  const M = (specWindow.Mocha = Mocha)
  const m = (specWindow.mocha = _mocha)

  // also attach the Mocha class
  // to the mocha instance for clarity
  m.Mocha = M

  // this needs to be part of the configuration of cypress.json
  // we can't just forcibly use bdd
  return ui(specWindow, _mocha, config)
}

const createMocha = (specWindow, config) => {
  const _mocha = new Mocha({
    reporter: () => {},
    timeout: false,
  })

  // set mocha props on the specWindow
  setMochaProps(specWindow, _mocha, config)

  // return the newly created mocha instance
  return _mocha
}

const getRunner = function (_mocha) {
  Runner.prototype.run = function () {
    // reset our runner#run function
    // so the next time we call it
    // its normal again!
    restoreRunnerRun()

    // return the runner instance
    return this
  }

  return _mocha.run()
}

const restoreRunnableClearTimeout = () => {
  Runnable.prototype.clearTimeout = runnableClearTimeout
}

const restoreRunnableResetTimeout = () => {
  Runnable.prototype.resetTimeout = runnableResetTimeout
}

const restoreRunnerRun = () => {
  Runner.prototype.run = runnerRun
}

const restoreRunnerFail = () => {
  Runner.prototype.fail = runnerFail
}

const restoreRunnableRun = () => {
  Runnable.prototype.run = runnableRun
}

const restoreSuiteRetries = () => {
  Suite.prototype.retries = suiteRetries
}

function restoreTestClone () {
  Test.prototype.clone = testClone
}

function restoreRunnerRunTests () {
  Runner.prototype.runTests = runnerRunTests
}

function restoreSuiteAddTest () {
  Mocha.Suite.prototype.addTest = suiteAddTest
}
const restoreHookRetries = () => {
  Hook.prototype.retries = hookRetries
}

const patchSuiteRetries = () => {
  Suite.prototype.retries = function (...args) {
    if (args[0] !== undefined && args[0] > -1) {
      const err = $errUtils.cypressErrByPath('mocha.manually_set_retries_suite', {
        args: {
          title: this.title,
          numRetries: args[0] ?? 2,
        },
      })

      throw err
    }

    return suiteRetries.apply(this, args)
  }
}

const patchHookRetries = () => {
  Hook.prototype.retries = function (...args) {
    if (args[0] !== undefined && args[0] > -1) {
      const err = $errUtils.cypressErrByPath('mocha.manually_set_retries_suite', {
        args: {
          title: this.parent.title,
          numRetries: args[0] ?? 2,
        },
      })

      // so this error doesn't cause a retry
      getTestFromRunnable(this)._retries = -1

      throw err
    }

    return hookRetries.apply(this, args)
  }
}

// matching the current Runner.prototype.fail except
// changing the logic for determing whether this is a valid err
const patchRunnerFail = () => {
  Runner.prototype.fail = function (runnable, err) {
    const errMessage = _.get(err, 'message')

    if (errMessage && errMessage.indexOf('Resolution method is overspecified') > -1) {
      err.message = $errUtils.errByPath('mocha.overspecified', { error: err.stack }).message
    }

    // if this isnt a correct error object then just bail
    // and call the original function
    if (Object.prototype.toString.call(err) !== '[object Error]') {
      return runnerFail.call(this, runnable, err)
    }

    // else replicate the normal mocha functionality
    ++this.failures

    runnable.state = 'failed'

    this.emit('fail', runnable, err)
  }
}

const patchRunnableRun = (Cypress) => {
  Runnable.prototype.run = function (...args) {
    const runnable = this

    Cypress.action('mocha:runnable:run', runnableRun, runnable, args)
  }
}

function patchTestClone () {
  Test.prototype.clone = function () {
    if (this._retriesBeforeEachFailedTestFn) {
      this.fn = this._retriesBeforeEachFailedTestFn
    }

    const ret = testClone.apply(this, arguments)

    // carry over testConfigOverrides
    ret.cfg = this.cfg

    // carry over test.id
    ret.id = this.id

    return ret
  }
}

function patchRunnerRunTests () {
  Runner.prototype.runTests = function () {
    const suite = arguments[0]

    const _slice = suite.tests.slice

    // HACK: we need to dynamically enqueue tests to suite.tests during a test run
    // however Mocha calls `.slice` on this property and thus we no longer have a reference
    // to the internal test queue. So we replace the .slice method
    // in a way that we keep a reference to the returned array. we name it suite.testsQueue
    suite.tests.slice = function () {
      this.slice = _slice

      const ret = _slice.apply(this, arguments)

      suite.testsQueue = ret

      return ret
    }

    const ret = runnerRunTests.apply(this, arguments)

    return ret
  }
}

const patchRunnableClearTimeout = () => {
  Runnable.prototype.clearTimeout = function (...args) {
    // call the original
    runnableClearTimeout.apply(this, args)

    this.timer = null
  }
}

function patchSuiteAddTest (Cypress) {
  Mocha.Suite.prototype.addTest = function (...args) {
    const test = args[0]

    const ret = suiteAddTest.apply(this, args)

    test.retries = function (...args) {
      if (args[0] !== undefined && args[0] > -1) {
        const err = $errUtils.cypressErrByPath('mocha.manually_set_retries_test', {
          args: {
            title: test.title,
            numRetries: args[0] ?? 2,
          },
        })

        // so this error doesn't cause a retry
        test._retries = -1

        throw err
      }

      return testRetries.apply(this, args)
    }

    return ret
  }
}

const patchRunnableResetTimeout = () => {
  Runnable.prototype.resetTimeout = function () {
    const runnable = this

    const ms = this.timeout() || 1e9

    this.clearTimeout()

    const getErrPath = function () {
      // we've yield an explicit done callback
      if (runnable.async) {
        return 'mocha.async_timed_out'
      }

      // TODO: improve this error message. It's not that
      // a command necessarily timed out - in fact this is
      // a mocha timeout, and a command likely *didn't*
      // time out correctly, so we received this message instead.
      return 'mocha.timed_out'
    }

    this.timer = setTimeout(() => {
      const err = $errUtils.errByPath(getErrPath(), { ms })

      runnable.callback(err)
      runnable.timedOut = true
    }, ms)
  }
}

const restore = () => {
  restoreRunnerRun()
  restoreRunnerFail()
  restoreRunnableRun()
  restoreRunnableClearTimeout()
  restoreRunnableResetTimeout()
  restoreSuiteRetries()
  restoreHookRetries()
  restoreRunnerRunTests()
  restoreTestClone()
  restoreSuiteAddTest()
}

const override = (Cypress) => {
  patchRunnerFail()
  patchRunnableRun(Cypress)
  patchRunnableClearTimeout()
  patchRunnableResetTimeout()
  patchSuiteRetries()
  patchHookRetries()
  patchRunnerRunTests()
  patchTestClone()
  patchSuiteAddTest(Cypress)
}

const create = (specWindow, Cypress, config) => {
  restore()

  override(Cypress)

  // generate the mocha + Mocha globals
  // on the specWindow, and get the new
  // _mocha instance
  const _mocha = createMocha(specWindow, config)

  const _runner = getRunner(_mocha)

  _mocha.suite.file = Cypress.spec.relative

  return {
    _mocha,

    createRootTest (title, fn) {
      const r = new Test(title, fn)

      _runner.suite.addTest(r)

      return r
    },

    getRunner () {
      return _runner
    },

    getRootSuite () {
      return _mocha.suite
    },
  }
}

module.exports = {
  restore,

  create,
}
