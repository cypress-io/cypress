/* eslint-disable prefer-rest-params */
import _ from 'lodash'
import $errUtils, { CypressError } from './error_utils'
import $utils from './utils'
import $stackUtils from './stack_utils'

// in the browser mocha is coming back
// as window
import * as mocha from 'mocha'

const { getTestFromRunnable } = $utils

const Mocha = (mocha as any).Mocha != null ? (mocha as any).Mocha : mocha

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
const suiteAddSuite = Suite.prototype.addSuite
const suiteRetries = Suite.prototype.retries
const hookRetries = Hook.prototype.retries
const suiteBeforeAll = Suite.prototype.beforeAll
const suiteBeforeEach = Suite.prototype.beforeEach
const suiteAfterAll = Suite.prototype.afterAll
const suiteAfterEach = Suite.prototype.afterEach

// don't let mocha pollute the global namespace
delete (window as any).mocha
delete (window as any).Mocha

export const SKIPPED_DUE_TO_BROWSER_MESSAGE = ' (skipped due to browser)'

interface CypressTest extends Mocha.Test {
  prevAttempts: CypressTest[]
  final?: boolean
  forceState?: 'passed'
}

type Strategy = 'detect-flake-and-pass-on-threshold' | 'detect-flake-but-always-fail' | undefined

type NormalizedRetriesConfig = {
  strategy?: Strategy
  maxRetries?: number
  passesRequired?: number
  stopIfAnyPassed?: boolean
}

// NOTE: 'calculateTestStatus' is marked as an individual function to make functionality easier to test.
export function calculateTestStatus (test: CypressTest, config?: NormalizedRetriesConfig) {
  // @ts-expect-error
  const totalAttemptsAlreadyExecuted = test.currentRetry() + 1
  let shouldAttemptsContinue: boolean = true
  let outerTestStatus: 'passed' | 'failed' | undefined = undefined

  const passedTests = _.filter(test.prevAttempts, (o) => o.state === 'passed')
  const failedTests = _.filter(test.prevAttempts, (o) => o.state === 'failed')

  // Additionally, if the current test attempt passed/failed, add it to the attempt list
  if (test.state === 'passed') {
    passedTests.push(test)
  } else if (test.state === 'failed') {
    failedTests.push(test)
  }

  // If there is AT LEAST one failed test attempt, we know we need to apply retry logic.
  // Otherwise, the test might be burning in (not implemented yet) OR the test passed on the first attempt,
  // meaning retry logic does NOT need to be applied.
  if (failedTests.length > 0) {
    const maxAttempts = test.retries() + 1
    const remainingAttempts = maxAttempts - totalAttemptsAlreadyExecuted
    const passingAttempts = passedTests.length

    // Below variables are used for when strategy is "detect-flake-and-pass-on-threshold" or no strategy is defined
    let passesRequired = config?.strategy !== 'detect-flake-but-always-fail' ?
      (config?.passesRequired || 1) :
      null

    const neededPassingAttemptsLeft = config?.strategy !== 'detect-flake-but-always-fail' ?
      (passesRequired as number) - passingAttempts :
      null

    // Below variables are used for when strategy is only "detect-flake-but-always-fail"
    let stopIfAnyPassed = config?.strategy === 'detect-flake-but-always-fail' ?
      (config.stopIfAnyPassed || false) :
      null

    // Do we have the required amount of passes? If yes, we no longer need to keep running the test.
    if (config?.strategy !== 'detect-flake-but-always-fail' && passingAttempts >= (passesRequired as number)) {
      outerTestStatus = 'passed'
      test.final = true
      shouldAttemptsContinue = false
    } else if (totalAttemptsAlreadyExecuted < maxAttempts &&
      (
        // For strategy "detect-flake-and-pass-on-threshold" or no strategy (current GA retries):
        //  If we haven't met our max attempt limit AND we have enough remaining attempts that can satisfy the passing requirement.
        // retry the test.
        (config?.strategy !== 'detect-flake-but-always-fail' && remainingAttempts >= (neededPassingAttemptsLeft as number)) ||
        // For strategy "detect-flake-but-always-fail":
        //  If we haven't met our max attempt limit AND
        //    stopIfAnyPassed is false OR
        //    stopIfAnyPassed is true and no tests have passed yet.
        // retry the test.
        (config?.strategy === 'detect-flake-but-always-fail' && (!stopIfAnyPassed || stopIfAnyPassed && passingAttempts === 0))
      )) {
      test.final = false
      shouldAttemptsContinue = true
    } else {
      // Otherwise, we should stop retrying the test.
      outerTestStatus = 'failed'
      test.final = true
      // If an outerStatus is 'failed', but the last test attempt was 'passed', we need to force the status so mocha doesn't flag the test attempt as failed.
      // This is a common use case with 'detect-flake-but-always-fail', where we want to display the last attempt as 'passed' but fail the test.
      test.forceState = test.state === 'passed' ? test.state : undefined
      shouldAttemptsContinue = false
    }
  } else {
    // retry logic did not need to be applied and the test passed.
    outerTestStatus = 'passed'
    shouldAttemptsContinue = false
    test.final = true
  }

  return {
    strategy: config?.strategy,
    shouldAttemptsContinue,
    attempts: totalAttemptsAlreadyExecuted,
    outerStatus: outerTestStatus,
  }
}

type MochaArgs = [string, Function | undefined]
function createRunnable (ctx, fnType: 'Test' | 'Suite', mochaArgs: MochaArgs, runnableFn: Function, testCallback: Function | string = '', _testConfig?: Record<string, any>) {
  const runnable = runnableFn.apply(ctx, mochaArgs)

  // attached testConfigOverrides will execute before `runner:test:before:run` event
  if (_testConfig) {
    runnable._testConfig = _testConfig
  }

  if (fnType === 'Test') {
    // persist the original callback so we can send it to the cloud
    // to prevent it from being registered as a modified test
    runnable.body = testCallback.toString()
  }

  return runnable
}

function overloadMochaFnForConfig (fnName, specWindow) {
  const _fn = specWindow[fnName]

  const fnType = fnName === 'it' || fnName === 'specify' ? 'Test' : 'Suite'

  function overrideMochaFn (fn) {
    specWindow[fnName] = fn()
    specWindow[fnName]['only'] = fn('only')
    specWindow[fnName]['skip'] = fn('skip')
    // override xit, xdescribe, etc
    if (specWindow[`x${fnName}`]) specWindow[`x${fnName}`] = specWindow[fnName]['skip']
  }

  const replacementFn = function (subFn) {
    return function (...args) {
      /**
       * @type {Cypress.Cypress}
       */
      const Cypress = specWindow.Cypress

      const origFn = subFn ? _fn[subFn] : _fn

      // fallback to empty string for stubbed runnables written like:
      // - describe('concept')
      // - it('does something')
      let testCallback = args[1]

      if (args.length > 2 && _.isObject(args[1])) {
        const _testConfig = _.extend({}, args[1]) as any

        const mochaArgs: MochaArgs = [args[0], args[2]]
        const originalTitle = mochaArgs[0]

        // fallback to empty string for stubbed runnables written like:
        // - describe('concept')
        // - it('does something')
        testCallback = mochaArgs[1]

        const configMatchesBrowser = _testConfig.browser == null || Cypress.isBrowser(_testConfig.browser, `${fnType} config value \`{ browser }\``)

        if (!configMatchesBrowser) {
          mochaArgs[0] = `${originalTitle}${SKIPPED_DUE_TO_BROWSER_MESSAGE}`

          // skip test at run-time when test is marked with .only but should also be skipped the test due to the browser
          if (subFn === 'only') {
            mochaArgs[1] = function () {
              this.skip()
            }

            return createRunnable(this, fnType, mochaArgs, origFn, testCallback, _testConfig)
          }

          // skip test with .skip func to ignore the test case and not run it
          return createRunnable(this, fnType, mochaArgs, _fn['skip'], testCallback, _testConfig)
        }

        return createRunnable(this, fnType, mochaArgs, origFn, testCallback, _testConfig)
      }

      return createRunnable(this, fnType, args as MochaArgs, origFn, testCallback)
    }
  }

  overrideMochaFn(replacementFn)
}

const ui = (specWindow, _mocha) => {
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

    return this
  }

  return _mocha.ui('bdd')
}

const setMochaProps = (specWindow, _mocha) => {
  // Mocha is usually defined in the spec when used normally
  // in the browser or node, so we add it as a global
  // for our users too
  const M = (specWindow.Mocha = Mocha)
  const m = (specWindow.mocha = _mocha)

  // also attach the Mocha class
  // to the mocha instance for clarity
  m.Mocha = M

  // this needs to be part of the configuration of cypress.config.{js,ts,mjs,cjs}
  // we can't just forcibly use bdd
  return ui(specWindow, _mocha)
}

const createMocha = (specWindow) => {
  const _mocha = new Mocha({
    reporter: () => {},
    timeout: false,
  })

  // set mocha props on the specWindow
  setMochaProps(specWindow, _mocha)

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

const restoreTestClone = () => {
  Test.prototype.clone = testClone
}

const removeCalculateTestStatus = () => {
  delete Test.prototype.calculateTestStatus
}

const restoreRunnerRunTests = () => {
  Runner.prototype.runTests = runnerRunTests
}

const restoreSuiteAddTest = () => {
  Suite.prototype.addTest = suiteAddTest
}

const restoreSuiteAddSuite = () => {
  Suite.prototype.addSuite = suiteAddSuite
}

const restoreHookRetries = () => {
  Hook.prototype.retries = hookRetries
}

const restoreSuiteHooks = () => {
  Suite.prototype.beforeAll = suiteBeforeAll
  Suite.prototype.beforeEach = suiteBeforeEach
  Suite.prototype.afterAll = suiteAfterAll
  Suite.prototype.afterEach = suiteAfterEach
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
      getTestFromRunnable(this).retries(-1)

      throw err
    }

    return hookRetries.apply(this, args)
  }
}

// matching the current Runner.prototype.fail except
// changing the logic for determining whether this is a valid err
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

    // carry over testConfig, id, and order
    ret._testConfig = this._testConfig
    ret.id = this.id
    ret.order = this.order
    ret._currentRetry = this._currentRetry

    return ret
  }
}

function getNormalizedRetriesConfig (Cypress: Cypress.Cypress): NormalizedRetriesConfig {
  const retriesConfig = Cypress.config('retries')
  const isInOpenMode = Cypress.config('isInteractive')

  if (retriesConfig == null) {
    return {}
  }

  if (typeof retriesConfig === 'number') {
    return {
      strategy: 'detect-flake-and-pass-on-threshold',
      maxRetries: retriesConfig,
      passesRequired: 1,
    }
  }

  const enablementKey: 'openMode'|'runMode' = isInOpenMode ? 'openMode' : 'runMode'
  const enablementValue = retriesConfig[enablementKey]

  // if retries are explicitly disabled, return an empty object
  if (enablementValue === false) {
    return {}
  }

  // by default, retries are disabled in open mode
  if (!enablementValue && isInOpenMode) {
    return {}
  }

  if (typeof enablementValue === 'number') {
    return {
      strategy: 'detect-flake-and-pass-on-threshold',
      maxRetries: enablementValue,
      passesRequired: 1,
    }
  }

  const config = retriesConfig as Cypress.RetryStrategy

  // TODO: For GA, rename experimentalStrategy to strategy, experimentalOptions to options
  return {
    strategy: config.experimentalStrategy,
    maxRetries: config.experimentalOptions?.maxRetries,
    passesRequired: config.experimentalOptions?.['passesRequired'],
    stopIfAnyPassed: config.experimentalOptions?.['stopIfAnyPassed'],
  }
}

function createCalculateTestStatus (Cypress: Cypress.Cypress) {
  // Adds a method to the test object called 'calculateTestStatus'
  // which is used inside our mocha patch (./driver/patches/mocha+7.0.1.dev.patch)
  // in order to calculate test retries. This prototype functions as a light abstraction around
  // 'calculateTestStatus', which makes the function easier to unit-test
  Test.prototype.calculateTestStatus = function () {
    const retriesConfig = getNormalizedRetriesConfig(Cypress)

    return calculateTestStatus(this, retriesConfig)
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

const patchSuiteAddTest = (specWindow, config) => {
  Suite.prototype.addTest = function (...args) {
    const test = args[0]

    if (!test.invocationDetails) {
      test.invocationDetails = $stackUtils.getInvocationDetails(specWindow, config)
    }

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

const patchSuiteAddSuite = (specWindow, config) => {
  Suite.prototype.addSuite = function (...args) {
    const suite = args[0]

    if (!suite.invocationDetails) {
      suite.invocationDetails = $stackUtils.getInvocationDetails(specWindow, config)
    }

    return suiteAddSuite.apply(this, args)
  }
}

const patchRunnableResetTimeout = () => {
  Runnable.prototype.resetTimeout = function () {
    const runnable = this
    // @ts-ignore Cypress.runner is not defined
    const currentRunner = Cypress.runner

    const ms = this.timeout() || 1e9

    this.clearTimeout()

    const getErrPath = function () {
      // we've yield an explicit done callback
      if (runnable.async) {
        return 'mocha.async_timed_out'
      }

      return 'miscellaneous.test_stopped'
    }

    this.timer = setTimeout(() => {
      // @ts-ignore Cypress.runner is not defined
      if (runnable.state === 'passed' || Cypress.runner !== currentRunner) {
        // this timeout can be reached at the same time that a
        // user does an asynchronous `done`, so double-check
        // that the test has not already passed before timing out
        return
      }

      const err = $errUtils.errByPath(getErrPath(), { ms })

      runnable.callback(err)
      runnable.timedOut = true
    }, ms)
  }
}

const patchSuiteHooks = (specWindow, config) => {
  _.each(['beforeAll', 'beforeEach', 'afterAll', 'afterEach'], (fnName) => {
    const _origHookFn = Suite.prototype[fnName]

    Suite.prototype[fnName] = function (title, hookConfig, fn) {
      const _origCreateHook = this._createHook

      this._createHook = function (title, fn) {
        const hook = _origCreateHook.call(this, title, fn)

        let invocationStack = hook.invocationDetails?.stack

        if (!hook.invocationDetails) {
          const invocationDetails = $stackUtils.getInvocationDetails(specWindow, config)!

          hook.invocationDetails = invocationDetails
          invocationStack = invocationDetails.stack
        }

        if (!hook.config) {
          hook.config = hookConfig
        }

        if (this._condensedHooks) {
          const err = $errUtils.errByPath('mocha.hook_registered_late', { hookTitle: fnName }) as CypressError

          err.setUserInvocationStack(invocationStack)

          throw err
        }

        return hook
      }

      const ret = _origHookFn.call(this, title, fn)

      this._createHook = _origCreateHook

      return ret
    }
  })
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
  removeCalculateTestStatus()
  restoreSuiteAddTest()
  restoreSuiteAddSuite()
  restoreSuiteHooks()
}

const override = (specWindow, Cypress, config) => {
  patchRunnerFail()
  patchRunnableRun(Cypress)
  patchRunnableClearTimeout()
  patchRunnableResetTimeout()
  patchSuiteRetries()
  patchHookRetries()
  patchRunnerRunTests()
  patchTestClone()
  createCalculateTestStatus(Cypress)
  patchSuiteAddTest(specWindow, config)
  patchSuiteAddSuite(specWindow, config)
  patchSuiteHooks(specWindow, config)
}

const create = (specWindow, Cypress, config) => {
  restore()

  override(specWindow, Cypress, config)

  // generate the mocha + Mocha globals
  // on the specWindow, and get the new
  // _mocha instance

  const _mocha = createMocha(specWindow)

  _mocha.slow(config('slowTestThreshold'))

  const _runner = getRunner(_mocha)

  _mocha.suite.file = Cypress.spec.relative

  return {
    _mocha,

    createRootTest (title, fn) {
      const r = new Test(title, fn)

      _runner.suite.addTest(r)

      return r
    },

    createTest (title, fn) {
      return new Test(title, fn)
    },

    getRunner () {
      return _runner
    },

    getRootSuite () {
      return _mocha.suite
    },
  }
}

export default {
  create,
  restore,
}
