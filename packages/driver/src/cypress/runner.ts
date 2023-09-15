import _ from 'lodash'
import dayjs from 'dayjs'
import Promise from 'bluebird'

import { LogUtils } from './log'
import $utils from './utils'
import $errUtils from './error_utils'
import $stackUtils from './stack_utils'
import { getResolvedTestConfigOverride } from '../cy/testConfigOverrides'
import debugFn from 'debug'
import type { Emissions, TestFilter } from '@packages/types'
import { SKIPPED_DUE_TO_BROWSER_MESSAGE } from './mocha'

const mochaCtxKeysRe = /^(_runnable|test)$/
const betweenQuotesRe = /\"(.+?)\"/

const HOOKS = ['beforeAll', 'beforeEach', 'afterEach', 'afterAll'] as const
// event fired before hooks and test execution
const TEST_BEFORE_RUN_ASYNC_EVENT = 'runner:test:before:run:async'
const TEST_BEFORE_RUN_EVENT = 'runner:test:before:run'
const TEST_BEFORE_AFTER_RUN_ASYNC_EVENT = 'runner:test:before:after:run:async'
const TEST_AFTER_RUN_ASYNC_EVENT = 'runner:test:after:run:async'
const TEST_AFTER_RUN_EVENT = 'runner:test:after:run'
const RUNNABLE_AFTER_RUN_ASYNC_EVENT = 'runner:runnable:after:run:async'

const RUNNABLE_LOGS = ['routes', 'agents', 'commands', 'hooks'] as const
const RUNNABLE_PROPS = [
  '_cypressTestStatusInfo', '_testConfig', 'id', 'order', 'title', '_titlePath', 'root', 'hookName', 'hookId', 'err', 'state', 'pending', 'failedFromHookId', 'body', 'speed', 'type', 'duration', 'wallClockStartedAt', 'wallClockDuration', 'timings', 'file', 'originalTitle', 'invocationDetails', 'final', 'currentRetry', 'retries', '_slow',
] as const

const debug = debugFn('cypress:driver:runner')
const debugErrors = debugFn('cypress:driver:errors')

const RUNNER_EVENTS = [
  TEST_BEFORE_RUN_ASYNC_EVENT,
  TEST_BEFORE_RUN_EVENT,
  TEST_BEFORE_AFTER_RUN_ASYNC_EVENT,
  TEST_AFTER_RUN_ASYNC_EVENT,
  TEST_AFTER_RUN_EVENT,
  RUNNABLE_AFTER_RUN_ASYNC_EVENT,
] as const

export type HandlerType = 'error' | 'unhandledrejection'

const duration = (before: Date, after: Date) => {
  return Number(before) - Number(after)
}

const fire = (event: typeof RUNNER_EVENTS[number], runnable, Cypress, ...args) => {
  debug('fire: %o', { event })
  if (runnable._fired == null) {
    runnable._fired = {}
  }

  runnable._fired[event] = true

  // don't fire anything again if we are skipped
  if (runnable._ALREADY_RAN) {
    return
  }

  return Cypress.action(event, wrap(runnable), runnable, ...args)
}

const fired = (event: typeof RUNNER_EVENTS[number], runnable) => {
  return !!(runnable._fired && runnable._fired[event])
}

const testBeforeRunAsync = (test, Cypress) => {
  return Promise.try(() => {
    if (!fired(TEST_BEFORE_RUN_ASYNC_EVENT, test)) {
      return fire(TEST_BEFORE_RUN_ASYNC_EVENT, test, Cypress)
    }
  })
}

const testBeforeAfterRunAsync = (test, Cypress, ...args) => {
  return Promise.try(() => {
    if (!fired(TEST_BEFORE_AFTER_RUN_ASYNC_EVENT, test)) {
      return fire(TEST_BEFORE_AFTER_RUN_ASYNC_EVENT, test, Cypress, ...args)
    }
  })
}

const testAfterRunAsync = (test, Cypress) => {
  return Promise.try(() => {
    if (!fired(TEST_AFTER_RUN_ASYNC_EVENT, test)) {
      return fire(TEST_AFTER_RUN_ASYNC_EVENT, test, Cypress)
    }
  })
}

const runnableAfterRunAsync = (runnable, Cypress) => {
  runnable.clearTimeout()

  return Promise.try(() => {
    // NOTE: other events we do not fire more than once, but this needed to change for test-retries
    return fire(RUNNABLE_AFTER_RUN_ASYNC_EVENT, runnable, Cypress)
  })
}

const testAfterRun = (test, Cypress) => {
  test.clearTimeout()
  if (!fired(TEST_AFTER_RUN_EVENT, test)) {
    setWallClockDuration(test)
    try {
      fire(TEST_AFTER_RUN_EVENT, test, Cypress)
    } catch (e) {
      // if the test:after:run listener throws it's likely spec code
      // Since the test status has already been emitted this can't affect the test status.
      // Let's just log the error to console
      // TODO: revisit when we handle uncaught exceptions/rejections between tests
      // eslint-disable-next-line no-console
      console.error(e)
    }

    // perf loop only through
    // a tests OWN properties and not
    // inherited properties from its shared ctx
    for (let key of Object.keys(test.ctx || {})) {
      const value = test.ctx[key]

      if (_.isObject(value) && !mochaCtxKeysRe.test(key)) {
        // nuke any object properties that come from
        // cy.as() aliases or anything set from 'this'
        // so we aggressively perform GC and prevent obj
        // ref's from building up
        test.ctx[key] = undefined
      }
    }

    // reset the fn to be empty function
    // for GC to be aggressive and prevent
    // closures from hold references
    test.fn = () => {}

    // prevent loop comprehension
    return null
  }

  return null
}

const setTestTimingsForHook = (test, hookName, obj) => {
  if (test.timings == null) {
    test.timings = {}
  }

  if (test.timings[hookName] == null) {
    test.timings[hookName] = []
  }

  return test.timings[hookName].push(obj)
}

const setTestTimings = (test, name, obj) => {
  if (test.timings == null) {
    test.timings = {}
  }

  test.timings[name] = obj
}

const setWallClockDuration = (test) => {
  return test.wallClockDuration = duration(new Date(), test.wallClockStartedAt)
}

// we need to optimize wrap by converting
// tests to an id-based object which prevents
// us from recursively iterating through every
// parent since we could just return the found test
const wrap = (runnable): Record<string, any> | null => {
  return $utils.reduceProps(runnable, RUNNABLE_PROPS)
}

// Reduce runnable down to its props and collections.
// Sent to the Reporter to populate command log
// and send to Cypress Cloud when in record mode.
const wrapAll = (runnable): Record<string, any> => {
  return _.extend(
    {},
    $utils.reduceProps(runnable, RUNNABLE_PROPS),
    $utils.reduceProps(runnable, RUNNABLE_LOGS),
  )
}

const condenseHooks = (runnable, getHookId) => {
  runnable._condensedHooks = true
  const hooks = _.compact(_.concat(
    runnable._beforeAll,
    runnable._beforeEach,
    runnable._afterAll,
    runnable._afterEach,
  ))

  return _.map(hooks, (hook) => {
    if (!hook.hookId) {
      hook.hookId = getHookId()
    }

    if (!hook.hookName) {
      hook.hookName = getHookName(hook)
    }

    return wrap(hook)
  })
}

const getHookName = (hook) => {
  // find the name of the hook by parsing its
  // title and pulling out whats between the quotes
  const name = hook.title.match(betweenQuotesRe)

  return name && name[1]
}

const forceGc = (obj) => {
  // aggressively forces GC by purging
  // references to ctx, and removes callback
  // functions for closures
  for (let key of Object.keys(obj.ctx || {})) {
    obj.ctx[key] = undefined
  }

  if (obj.fn) {
    obj.fn = () => {}
  }
}

const eachHookInSuite = (suite, fn) => {
  for (let type of HOOKS) {
    for (let hook of suite[`_${type}`]) {
      fn(hook)
    }
  }

  // prevent loop comprehension
  return null
}

// iterates over a suite's tests (including nested suites)
// and will return as soon as the callback is true
const findTestInSuite = (suite, fn: any = _.identity) => {
  for (const test of suite.tests) {
    if (fn(test)) {
      return test
    }
  }

  for (const childSuite of suite.suites) {
    const test = findTestInSuite(childSuite, fn)

    if (test) {
      return test
    }
  }
}

const findSuiteInSuite = (suite, fn: any = _.identity) => {
  if (fn(suite)) {
    return suite
  }

  for (const childSuite of suite.suites) {
    const foundSuite = findSuiteInSuite(childSuite, fn)

    if (foundSuite) {
      return foundSuite
    }
  }
}

const suiteHasTest = (suite, testId) => {
  return findTestInSuite(suite, (test) => test.id === testId)
}

const suiteHasSuite = (suite, suiteId) => {
  return findSuiteInSuite(suite, (s) => s.id === suiteId)
}

// same as findTestInSuite but iterates backwards
const findLastTestInSuite = (suite, fn: any = _.identity) => {
  for (let i = suite.suites.length - 1; i >= 0; i--) {
    const test = findLastTestInSuite(suite.suites[i], fn)

    if (test) {
      return test
    }
  }

  for (let i = suite.tests.length - 1; i >= 0; i--) {
    const test = suite.tests[i]

    if (fn(test)) {
      return test
    }
  }
}

const getAllSiblingTests = (suite, getTestById) => {
  const tests: any[] = []

  suite.eachTest((testRunnable) => {
    // iterate through each of our suites tests.
    // this will iterate through all nested tests
    // as well.  and then we add it only if its
    // in our filtered tests array
    const test = getTestById(testRunnable.id)

    if (test) {
      return tests.push(test)
    }

    return
  })

  return tests
}

function getTestIndexFromId (id) {
  return +id.slice(1)
}

const getTestFromHook = (hook) => {
  // if theres already a currentTest use that

  const test = hook.ctx.currentTest

  if (test) {
    return test
  }
}

// we have to see if this is the last suite amongst
// its siblings.  but first we have to filter out
// suites which dont have a filtered test in them
const isLastSuite = (suite, tests) => {
  if (suite.root) {
    return false
  }

  // grab all of the suites from our filtered tests
  // including all of their ancestor suites!
  const suites = _.reduce<any, any[]>(tests, (memo, test) => {
    let parent

    while ((parent = test.parent)) {
      memo.push(parent)
      test = parent
    }

    return memo
  }, [])

  // intersect them with our parent suites and see if the last one is us
  return _
  .chain(suites)
  .uniq()
  .intersection(suite.parent.suites)
  .last()
  .value() === suite
}

// we are the last test that will run in the suite
// if we're the last test in the tests array or
// if we failed from a hook and that hook was 'before'
// since then mocha skips the remaining tests in the suite
const lastTestThatWillRunInSuite = (test, tests) => {
  return isLastTest(test, tests) || (test.failedFromHookId && (test.hookName === 'before all'))
}

const nextTestThatWillRunInSuite = (test, tests) => {
  if (test.failedFromHookId && (test.hookName === 'before all')) {
    return null
  }

  const index = _.findIndex(tests, { id: test.id })

  return index < tests.length - 1 ? tests[index + 1] : null
}

const isLastTest = (test, tests) => {
  return test.id === _.get(_.last(tests), 'id')
}

const isRootSuite = (suite) => {
  return suite && suite.root
}

const overrideRunnerHook = (Cypress, _runner, getTestById, getTest, setTest, getTests, cy) => {
  // bail if our _runner doesn't have a hook.
  // useful in tests
  if (!_runner.hook) {
    return
  }

  // monkey patch the hook event so we can wrap
  // 'test:after:run' around all of
  // the hooks surrounding a test runnable
  // const _runnerHook = _runner.hook

  _runner.hook = $utils.monkeypatchBefore(_runner.hook, function (name, fn) {
    if (name !== 'afterAll' && name !== 'afterEach') {
      return
    }

    const test = getTest()
    const allTests = getTests()

    let shouldFireTestAfterRun = () => false

    switch (name) {
      case 'afterEach':
        shouldFireTestAfterRun = () => {
          // find all of the grep'd tests which share
          // the same parent suite as our current test
          const tests = getAllSiblingTests(test.parent, getTestById)

          if (this.suite.root) {
            _runner._shouldBufferSuiteEnd = true

            // make sure this test isnt the last test overall but also
            // isnt the last test in our filtered parent suite's tests array
            if (test.final === false || (test !== _.last(allTests)) && (test !== _.last(tests))) {
              return true
            }
          }

          return false
        }

        break

      case 'afterAll':
        shouldFireTestAfterRun = () => {
          // find all of the filtered allTests which share
          // the same parent suite as our current _test
          // const t = getTest()

          if (test) {
            const siblings = getAllSiblingTests(test.parent, getTestById)

            const testIsActuallyInSuite = suiteHasTest(this.suite, test.id)

            // we ensure the test actually belongs to this suite.
            // the test may not belong to the suite when a suite is skipped
            // due to already being run on top navigation
            // https://github.com/cypress-io/cypress/issues/9026
            if (!testIsActuallyInSuite) {
              return false
            }

            // 1. if we're the very last test in the entire allTests
            //    we wait until the root suite fires
            // 2. else if we arent the last nested suite we fire if we're
            //    the last test that will run

            if (
              (isRootSuite(this.suite) && isLastTest(test, allTests)) ||
              (!isLastSuite(this.suite, allTests) && lastTestThatWillRunInSuite(test, siblings))
            ) {
              return true
            }
          }

          return false
        }

        break

      default:
        break
    }

    const newArgs = [name, $utils.monkeypatchBeforeAsync(fn,
      async function () {
        if (!shouldFireTestAfterRun()) return

        setTest(null)

        if (test.final !== false) {
          test.final = true
          // If the last test attempt passed, but the outerStatus isn't marked as failed, then we want to emit the mocha 'pass' event.
          if (test.state === 'passed' && test?._cypressTestStatusInfo?.outerStatus !== 'failed') {
            Cypress.action('runner:pass', wrap(test))
          }

          Cypress.action('runner:test:end', wrap(test))

          _runner._shouldBufferSuiteEnd = false
          _runner._onTestAfterRun.map((fn) => {
            return fn()
          })

          _runner._onTestAfterRun = []
        }

        let topSuite = test

        while (topSuite.parent) {
          topSuite = topSuite.parent
        }

        const isRunMode = !Cypress.config('isInteractive')
        const isHeadedNoExit = Cypress.config('browser').isHeaded && !Cypress.config('exit')
        const shouldAlwaysResetPage = isRunMode && !isHeadedNoExit

        // If we're not in open mode or we're in open mode and not the last test we reset state.
        // The last test will needs to stay so that the user can see what the end result of the AUT was.
        if (shouldAlwaysResetPage || !lastTestThatWillRunInSuite(test, getAllSiblingTests(topSuite, getTestById))) {
          const nextTest = nextTestThatWillRunInSuite(test, getAllSiblingTests(topSuite, getTestById))
          const nextTestIsolationOverride = nextTest?._testConfig.unverifiedTestConfig.testIsolation
          const topLevelTestIsolation = Cypress.originalConfig['testIsolation']
          const nextTestHasTestIsolationOn = nextTestIsolationOverride || (nextTestIsolationOverride === undefined && topLevelTestIsolation)

          cy.state('duringUserTestExecution', false)
          Cypress.primaryOriginCommunicator.toAllSpecBridges('sync:state', { 'duringUserTestExecution': false })
          // Remove window:load and window:before:load listeners so that navigating to about:blank doesn't fire in user code.
          cy.removeAllListeners('internal:window:load')
          cy.removeAllListeners('window:before:load')
          cy.removeAllListeners('window:load')

          // This will navigate to about:blank if test isolation is on
          await testBeforeAfterRunAsync(test, Cypress, { nextTestHasTestIsolationOn })
        }

        testAfterRun(test, Cypress)
        await testAfterRunAsync(test, Cypress)
      })]

    return newArgs
  })
}

const getTestResults = (tests) => {
  return _.map(tests, (test) => {
    const obj: Record<string, any> = _.pick(test, 'title', 'id', 'duration', 'state')

    // TODO FIX THIS!
    if (!obj.state) {
      obj.state = 'skipped'
    }

    return obj
  })
}

const hasOnly = (suite) => {
  return (
    suite._onlyTests.length ||
    suite._onlySuites.length ||
    _.some(suite.suites, hasOnly)
  )
}

// Removes a suite and any of it's hooks/tests. Also removes the reference to itself so that it can be GC'd
const pruneSuite = (emptySuite) => {
  emptySuite.cleanReferences()

  if (emptySuite.parent) {
    const parentSuites = emptySuite.parent.suites.filter((suite) => suite !== emptySuite)

    emptySuite.parent.suites = parentSuites
    emptySuite.parent._onlySuites = emptySuite.parent._onlySuites.filter((suite) => parentSuites.includes(suite))
    emptySuite.parent = null
  }
}

// When in open mode and a "testFilter" is active, tests/suites that do not match the test filter
// need to be removed as they might have modifiers (.only) that would affect the matched set of tests.
// This function will recursively iterate through all of the suites and filter out any tests that do not
// match the specified filter. If the suite is empty after removing the tests, the suite is also removed.
const pruneEmptySuites = (rootSuite, testFilter: NonNullable<TestFilter>) => {
  // We want to start at the lowest level so recurse first. We want to prune child suites before parents

  let totalUnfilteredTests = 0

  for (const suite of [...rootSuite.suites]) {
    totalUnfilteredTests += pruneEmptySuites(suite, testFilter)
  }

  if (!rootSuite.suites.length && !rootSuite.tests.length) {
    pruneSuite(rootSuite)
  }

  if (rootSuite.tests.length) {
    totalUnfilteredTests += rootSuite.tests.length

    const tests: any[] = []
    const onlyTests: any[] = []

    for (const test of rootSuite.tests) {
      // Tests/suites of the shape "it('should', { browser: 'chrome' }, ...)" will have their title
      // updated with a skipped message. Even if the test is skipped we should still show it in the reporter
      // so we match the "fullTitle" with the skipped message removed.
      const fullTitle = test.fullTitle().replaceAll(SKIPPED_DUE_TO_BROWSER_MESSAGE, '')

      if (testFilter.includes(fullTitle)) {
        tests.push(test)

        if (rootSuite._onlyTests.includes(test)) {
          onlyTests.push(test)
        }
      } else {
        delete test.fn
      }
    }

    rootSuite.tests = tests
    rootSuite._onlyTests = onlyTests

    if (!rootSuite.tests.length && !rootSuite.suites.length) {
      pruneSuite(rootSuite)
    }
  }

  return totalUnfilteredTests
}

const normalizeAll = (suite, initialTests = {}, testFilter, setTestsById, setTests, getRunnableId, getHookId, getOnlyTestId, getOnlySuiteId, createEmptyOnlyTest) => {
  let totalUnfilteredTests = 0

  // Empty suites don't have any impact in run mode so let's avoid this extra work.
  if (Cypress.config('isInteractive') && testFilter) {
    totalUnfilteredTests = pruneEmptySuites(suite, testFilter)
  }

  let hasTests = false

  // only loop until we find the first test
  findTestInSuite(suite, (test) => {
    return hasTests = true
  })

  // if we dont have any tests then bail
  // unless we're using studio to add to the root suite
  if (!hasTests && getOnlySuiteId() !== 'r1') {
    return
  }

  // we are doing a super perf loop here where
  // we hand back a normalized object but also
  // create optimized lookups for the tests without
  // traversing through it multiple times
  const tests: Record<string, any> = {}

  const normalizedSuite = normalize(suite, tests, initialTests, getRunnableId, getHookId, getOnlyTestId, getOnlySuiteId, createEmptyOnlyTest)

  if (setTestsById) {
    // use callback here to hand back
    // the optimized tests
    setTestsById(tests)
  }

  if (setTests) {
    let i = 0

    const testsArr = _.map(tests, (test) => {
      test.order = i += 1

      return test
    })

    // same pattern here
    setTests(testsArr)
  }

  // generate the diff of the config after spec has been executed
  // e.g. config changes via Cypress.config('...')
  normalizedSuite.runtimeConfig = {}
  _.map(Cypress.config(), (v, key) => {
    if (_.isEqual(v, Cypress.originalConfig[key])) {
      return null
    }

    normalizedSuite.runtimeConfig[key] = v

    return
  })

  normalizedSuite.testFilter = testFilter
  normalizedSuite.totalUnfilteredTests = totalUnfilteredTests

  return normalizedSuite
}

const normalize = (runnable, tests, initialTests, getRunnableId, getHookId, getOnlyTestId, getOnlySuiteId, createEmptyOnlyTest) => {
  const normalizeRunnable = (runnable) => {
    if (!runnable.id) {
      runnable.id = getRunnableId()
    }

    // tests have a type of 'test' whereas suites do not have a type property
    if (runnable.type == null) {
      runnable.type = 'suite'
    }

    // if we have a runnable in the initial state
    // then merge in existing properties into the runnable
    const i = initialTests[runnable.id]

    let prevAttempts

    if (i) {
      prevAttempts = []

      if (i.prevAttempts) {
        prevAttempts = _.map(i.prevAttempts, wrapAll)
      }

      _.extend(runnable, i)
    }

    // merge all hooks into single array
    runnable.hooks = condenseHooks(runnable, getHookId)

    const wrappedRunnable = wrapAll(runnable)

    if (runnable.type === 'test') {
      const cfg = getResolvedTestConfigOverride(runnable)

      if (_.size(cfg)) {
        runnable._testConfig = cfg
        wrappedRunnable._testConfig = cfg
      }

      wrappedRunnable._titlePath = runnable.titlePath()
    }

    if (prevAttempts) {
      wrappedRunnable.prevAttempts = prevAttempts
    }

    return wrappedRunnable
  }

  const push = (test) => {
    return tests[test.id] != null ? tests[test.id] : (tests[test.id] = test)
  }

  const onlyIdMode = () => {
    return !!getOnlyTestId() || !!getOnlySuiteId()
  }

  const suiteHasOnlyId = (suite) => {
    return suiteHasTest(suite, getOnlyTestId()) || suiteHasSuite(suite, getOnlySuiteId())
  }

  const normalizedRunnable = normalizeRunnable(runnable)

  if (getOnlySuiteId() && runnable.id === getOnlySuiteId()) {
    createEmptyOnlyTest(runnable)
  }

  if ((runnable.type !== 'suite') || !hasOnly(runnable)) {
    if (runnable.type === 'test' && (!getOnlyTestId() || runnable.id === getOnlyTestId())) {
      push(runnable)
    }

    const runnableTests = runnable.tests
    const runnableSuites = runnable.suites

    if (onlyIdMode()) {
      runnable.tests = []
      runnable._onlyTests = []
      runnable.suites = []
      runnable._onlySuites = []
      runnable._afterAll = []
      runnable._afterEach = []
    }

    // recursively iterate and normalize all other _runnables
    _.each({ tests: runnableTests, suites: runnableSuites }, (_runnables, type) => {
      if (runnable[type]) {
        return normalizedRunnable[type] = _.compact(_.map(_runnables, (childRunnable) => {
          const normalizedChild = normalize(childRunnable, tests, initialTests, getRunnableId, getHookId, getOnlyTestId, getOnlySuiteId, createEmptyOnlyTest)

          if (type === 'tests' && onlyIdMode()) {
            if (normalizedChild.id === getOnlyTestId()) {
              runnable.tests = [childRunnable]
              runnable._onlyTests = [childRunnable]

              return normalizedChild
            }

            return null
          }

          if (type === 'suites' && onlyIdMode()) {
            if (suiteHasOnlyId(childRunnable)) {
              runnable.suites = [childRunnable]
              runnable._onlySuites = [childRunnable]

              return normalizedChild
            }

            return null
          }

          return normalizedChild
        }))
      }

      return null
    })

    return normalizedRunnable
  }

  // this follows how mocha filters onlys. its runner#filterOnly
  // is pretty much the same minus the normalization part
  const filterOnly = (normalizedSuite, suite) => {
    if (suite._onlyTests.length) {
      const suiteOnlyTests = suite._onlyTests

      if (getOnlyTestId()) {
        suite.tests = []
        suite._onlyTests = []
        suite._afterAll = []
        suite._afterEach = []
      } else {
        suite.tests = suite._onlyTests
      }

      normalizedSuite.tests = _.compact(_.map(suiteOnlyTests, (test) => {
        const normalizedTest = normalizeRunnable(test)

        if (getOnlyTestId()) {
          if (normalizedTest.id === getOnlyTestId()) {
            suite.tests = [test]
            suite._onlyTests = [test]

            push(test)

            return normalizedTest
          }

          return null
        }

        push(test)

        return normalizedTest
      }))

      suite.suites = []
      normalizedSuite.suites = []
    } else {
      suite.tests = []
      normalizedSuite.tests = []

      _.each(suite._onlySuites, (onlySuite) => {
        const normalizedOnlySuite = normalizeRunnable(onlySuite)

        if (hasOnly(onlySuite)) {
          filterOnly(normalizedOnlySuite, onlySuite)
        }
      })

      const suiteSuites = suite.suites

      suite.suites = []

      normalizedSuite.suites = _.compact(_.map(suiteSuites, (childSuite) => {
        const normalizedChildSuite = normalize(childSuite, tests, initialTests, getRunnableId, getHookId, getOnlyTestId, getOnlySuiteId, createEmptyOnlyTest)

        if ((suite._onlySuites.indexOf(childSuite) !== -1) || filterOnly(normalizedChildSuite, childSuite)) {
          if (onlyIdMode()) {
            if (suiteHasOnlyId(childSuite)) {
              suite.suites.push(childSuite)

              return normalizedChildSuite
            }

            return null
          }

          suite.suites.push(childSuite)

          return normalizedChildSuite
        }

        return null
      }))
    }

    return suite.tests.length || suite.suites.length
  }

  filterOnly(normalizedRunnable, runnable)

  return normalizedRunnable
}

const hookFailed = (hook, err, getTest, getTestFromHookOrFindTest) => {
  // NOTE: sometimes mocha will fail a hook without having emitted on('hook')
  // event, so this hook might not have currentTest set correctly
  // in which case we need to lookup the test
  const test = getTest() || getTestFromHookOrFindTest(hook)

  setHookFailureProps(test, hook, err)

  if (hook.alreadyEmittedMocha) {
    test.alreadyEmittedMocha = true
  } else {
    return Cypress.action('runner:test:end', wrap(test))
  }
}

const setHookFailureProps = (test, hook, err) => {
  err = $errUtils.wrapErr(err)
  const hookName = getHookName(hook)

  test.err = err
  test.state = 'failed'
  test.duration = hook.duration // TODO: nope (?)
  test.hookName = hookName // TODO: why are we doing this?
  test.failedFromHookId = hook.hookId
  // There should never be a case where the outerStatus of a test is set AND the last test attempt failed on a hook and the state is passed.
  // Therefore, if the last test attempt fails on a hook, the outerStatus should also indicate a failure.
  if (test?._cypressTestStatusInfo?.outerStatus) {
    test._cypressTestStatusInfo.outerStatus = test.state
  }
}

function getTestFromRunnable (runnable) {
  switch (runnable.type) {
    case 'hook':
      return getTestFromHook(runnable)

    case 'test':
      return runnable
    default: null
  }
}

const _runnerListeners = (_runner, Cypress, _emissions, getTestById, getTest, setTest, getTestFromHookOrFindTest) => {
  _runner.on('start', () => {
    return Cypress.action('runner:start', {
      start: new Date(),
    })
  })

  _runner.on('end', () => {
    return Cypress.action('runner:end', {
      end: new Date(),
    })
  })

  _runner.on('suite', (suite) => {
    if (_emissions.started[suite.id]) {
      return
    }

    _emissions.started[suite.id] = true

    return Cypress.action('runner:suite:start', wrap(suite))
  })

  _runner._shouldBufferSuiteEnd = false
  _runner._onTestAfterRun = []

  _runner.on('suite end', (suite) => {
    const handleSuiteEnd = () => {
    // cleanup our suite + its hooks
      forceGc(suite)
      eachHookInSuite(suite, forceGc)

      if (_emissions.ended[suite.id]) {
        return
      }

      _emissions.ended[suite.id] = true

      Cypress.action('runner:suite:end', wrap(suite))
    }

    if (_runner._shouldBufferSuiteEnd) {
      _runner._onTestAfterRun = _runner._onTestAfterRun.concat([handleSuiteEnd])

      return
    }

    return handleSuiteEnd()
  })

  _runner.on('hook', (hook) => {
    // mocha incorrectly sets currentTest on before/after all's.
    // if there is a nested suite with a before, then
    // currentTest will refer to the previous test run
    // and not our current
    // https://github.com/cypress-io/cypress/issues/1987
    if ((hook.hookName === 'before all' || hook.hookName === 'after all') && hook.ctx.currentTest) {
      delete hook.ctx.currentTest
    }

    let test = getTest()

    if (test && test.state !== 'pending') {
      // if the current test isn't within the hook's suite
      // then don't run the hook https://github.com/cypress-io/cypress/issues/17705
      if (!suiteHasTest(hook.parent, test.id)) {
        return
      }
    } else {
      // https://github.com/cypress-io/cypress/issues/9162
      // In https://github.com/cypress-io/cypress/issues/8113, getTest() call was removed to handle skip() properly.
      // But it caused tests to hang when there's a failure in before().
      // That's why getTest() is revived and checks if the state is 'pending'.

      // set the hook's id from the test because
      // hooks do not have their own id, their
      // commands need to grouped with the test
      // and we can only associate them by this id
      test = getTestFromHookOrFindTest(hook)
    }

    if (!test) {
      // we couldn't find a test to run with this hook
      // probably because the entire suite has already completed
      // so return early and tell onRunnableRun to skip the test
      return
    }

    hook.id = test.id
    hook.ctx.currentTest = test

    // make sure we set this test as the current now
    // else its possible that our TEST_AFTER_RUN_EVENT
    // will never fire if this failed in a before hook
    setTest(test)

    return Cypress.action('runner:hook:start', wrap(hook))
  })

  _runner.on('hook end', (hook) => {
    return Cypress.action('runner:hook:end', wrap(hook))
  })

  _runner.on('test', (test) => {
    setTest(test)

    if (_emissions.started[test.id]) {
      return
    }

    _emissions.started[test.id] = true

    return Cypress.action('runner:test:start', wrap(test))
  })

  _runner.on('test end', (test) => {
    if (_emissions.ended[test.id]) {
      return
    }

    _emissions.ended[test.id] = true

    // NOTE: we wait to send 'test end' until after hooks run
    // return Cypress.action('runner:test:end', wrap(test))
  })

  // Ignore the 'pass' event since we emit our own
  // _runner.on('pass', (test) => {
  //   return Cypress.action('runner:pass', wrap(test))
  // })

  /**
   * Mocha retry event is only fired in Mocha version 6+
   * https://github.com/mochajs/mocha/commit/2a76dd7589e4a1ed14dd2a33ab89f182e4c4a050
   */
  _runner.on('retry', (test, err) => {
    test.err = $errUtils.wrapErr(err)
    Cypress.action('runner:retry', wrap(test), test.err)
  })

  // if a test is pending mocha will only
  // emit the pending event instead of the test
  // so we normalize the pending / test events
  _runner.on('pending', function (test) {
    // do nothing if our test is skipped
    if (test._ALREADY_RAN) {
      return
    }

    if (!fired(TEST_BEFORE_RUN_EVENT, test)) {
      fire(TEST_BEFORE_RUN_EVENT, test, Cypress)
    }

    test.state = 'pending'

    if (!test.alreadyEmittedMocha) {
      // do not double emit this event
      test.alreadyEmittedMocha = true

      Cypress.action('runner:pending', wrap(test))
    }

    this.emit('test', test)

    // if this is not the last test amongst its siblings
    // then go ahead and fire its test:after:run event
    // else this will not get called
    const tests = getAllSiblingTests(test.parent, getTestById)

    if (_.last(tests) !== test) {
      test.final = true

      return fire(TEST_AFTER_RUN_EVENT, test, Cypress)
    }
  })

  _runner.on('fail', (runnable, err) => {
    let hookName
    const isHook = runnable.type === 'hook'

    err.stack = $stackUtils.normalizedStack(err)

    if (isHook) {
      const parentTitle = runnable.parent.title

      hookName = getHookName(runnable)
      const test = getTest() || getTestFromHookOrFindTest(runnable)

      const unsupportedPlugin = $errUtils.getUnsupportedPlugin(runnable)

      // append a friendly message to the error indicating
      // we're skipping the remaining tests in this suite
      const errMessage = $errUtils.errByPath('uncaught.error_in_hook', {
        parentTitle,
        hookName,
        retries: test._retries,
        unsupportedPlugin,
        errMessage: err.message,
      }).message

      if (unsupportedPlugin) {
        err = $errUtils.modifyErrMsg(err, errMessage, () => errMessage)
      } else {
        err = $errUtils.appendErrMsg(err, errMessage)
      }
    }

    // always set runnable err so we can tap into
    // taking a screenshot on error
    runnable.err = $errUtils.wrapErr(err)
    // If the last test passed, but the outerStatus of a test failed, we need to correct the status of the test to say 'passed'
    // (see 'calculateTestStatus' in ./driver/src/cypress/mocha.ts).
    runnable.state = runnable.forceState || runnable.state

    if (!runnable.alreadyEmittedMocha) {
      // do not double emit this event
      runnable.alreadyEmittedMocha = true

      Cypress.action('runner:fail', wrap(runnable), runnable.err)
    }

    // if we've already fired the test after run event
    // it means that this runnable likely failed due to
    // a double done(err) callback, and we need to fire
    // this again!
    if (fired(TEST_AFTER_RUN_EVENT, runnable)) {
      fire(TEST_AFTER_RUN_EVENT, runnable, Cypress)
    }

    if (isHook) {
      // if a hook fails (such as a before) then the test will never
      // get run and we'll need to make sure we set the test so that
      // the TEST_AFTER_RUN_EVENT fires correctly
      return hookFailed(runnable, runnable.err, getTest, getTestFromHookOrFindTest)
    }
  })
}

export default {
  create: (specWindow, mocha, Cypress, cy, state) => {
    let _runnableId = 0
    let _hookId = 0
    let _uncaughtFn: (() => never) | null = null
    let _resumedAtTestIndex: number | null = null
    let _skipCollectingLogs = true
    const _runner = mocha.getRunner()

    _runner.suite = mocha.getRootSuite()

    function isNotAlreadyRunTest (test) {
      return _resumedAtTestIndex == null || getTestIndexFromId(test.id) >= _resumedAtTestIndex
    }

    const getTestFromHookOrFindTest = (hook) => {
      const test = getTestFromHook(hook)

      if (test) {
        return test
      }

      const suite = hook.parent

      let foundTest

      if (hook.hookName === 'after all') {
        foundTest = findLastTestInSuite(suite, isNotAlreadyRunTest)
      } else if (hook.hookName === 'before all') {
        foundTest = findTestInSuite(suite, isNotAlreadyRunTest)
      }

      // if test has retried, we getTestById will give us the last attempt
      foundTest = foundTest && getTestById(foundTest.id)

      return foundTest
    }

    // eslint-disable-next-line @cypress/dev/arrow-body-multiline-braces
    const onSpecError = (handlerType: HandlerType) => (event) => {
      let { originalErr, err } = $errUtils.errorFromUncaughtEvent(handlerType, event)

      debugErrors('uncaught spec error: %o', originalErr)

      $errUtils.logError(Cypress, handlerType, originalErr)

      // we can stop here because this error will fail the current test
      if (state('runnable')) {
        cy.onUncaughtException({
          frameType: 'spec',
          handlerType,
          err,
        })

        return undefined
      }

      err = $errUtils.createUncaughtException({
        frameType: 'spec',
        handlerType,
        state,
        err,
      })

      // otherwise there's no test to associate this error to
      const appendMsg = [
        'Cypress could not associate this error to any specific test.',
        'We dynamically generated a new test to display this failure.',
      ].join('\n\n')

      err = $errUtils.appendErrMsg(err, appendMsg)

      // we use this below to create a test and tie this error to it
      _uncaughtFn = () => {
        throw err
      }

      // return undefined so the browser does its default
      // uncaught exception behavior (logging to console)
      return undefined
    }

    // Unlike End To End Testing which has two iframes
    // - Spec Frame, for the spec.
    // - AUT Frame, for the user's application.
    // Component Testing only has one iframe. The AUT Frame is also the Spec Frame,
    // since we serve the specs from a dev server - they are bundled as a single file.
    // We don't want to bind two error handlers, or we end up logging errors twice.
    // For this reason, we conditionally add these event listeners here - Component Testing errors are captured and logged
    // in contentWindowListeners#bindToListeners in cypress/cy.ts.
    if (Cypress.testingType === 'e2e') {
      specWindow.addEventListener('error', onSpecError('error'))
      specWindow.addEventListener('unhandledrejection', onSpecError('unhandledrejection'))
    }

    // hold onto the _runnables for faster lookup later
    let _test: any = null
    let _tests: any[] = []
    let _testsById: Record<string, any> = {}
    const _testsQueue: any[] = []
    const _testsQueueById: Record<string, any> = {}
    // only used during normalization
    let _emissions: Emissions = {
      started: {},
      ended: {},
    }
    let _startTime: string | null = null
    let _onlyTestId = null
    let _onlySuiteId = null

    const getRunnableId = () => {
      return `r${++_runnableId}`
    }

    const getHookId = () => {
      return `h${++_hookId}`
    }

    const setTestsById = (tbid) => {
      return _testsById = tbid
    }

    const setTests = (t) => {
      return _tests = t
    }

    const getTests = () => {
      return _tests
    }

    const getTest = () => {
      return _test
    }

    const setTest = (t) => {
      return _test = t
    }

    const getTestById = (id) => {
      // perf short circuit
      if (!id) {
        return
      }

      return _testsById[id]
    }

    const replaceTest = (runnable, id) => {
      const testsQueueIndex = _.findIndex(_testsQueue, { id })

      _testsQueue.splice(testsQueueIndex, 1, runnable)

      _testsQueueById[id] = runnable

      const testsIndex = _.findIndex(_tests, { id })

      _tests.splice(testsIndex, 1, runnable)

      _testsById[id] = runnable
    }

    const setOnlyTestId = (testId) => {
      _onlyTestId = testId
    }

    const getOnlyTestId = () => _onlyTestId

    const setOnlySuiteId = (suiteId) => {
      _onlySuiteId = suiteId
    }

    const getOnlySuiteId = () => _onlySuiteId

    overrideRunnerHook(Cypress, _runner, getTestById, getTest, setTest, getTests, cy)

    // this forces mocha to enqueue a duplicate test in the case of test retries
    const replacePreviousAttemptWith = (test) => {
      const prevAttempt = _testsById[test.id]

      const prevAttempts = prevAttempt.prevAttempts || []

      const newPrevAttempts = prevAttempts.concat([prevAttempt])

      delete prevAttempt.prevAttempts

      test.prevAttempts = newPrevAttempts

      replaceTest(test, test.id)
    }

    const maybeHandleRetryOnFailure = (runnable, err) => {
      const r = runnable
      const isHook = r.type === 'hook'
      const isTest = r.type === 'test'
      const test = getTest() || getTestFromHook(runnable)
      const hookName = isHook && getHookName(r)
      const isBeforeEachHook = isHook && !!hookName.match(/before each/)
      const isAfterEachHook = isHook && !!hookName.match(/after each/)
      let isBeforeEachThatIsRetryable = false
      let isAfterEachThatIsRetryable = false

      if (isBeforeEachHook || isAfterEachHook) {
        if (err) {
          // If the beforeEach/afterEach hook failed, mark the test attempt as failed
          test.state = 'failed'
        }

        // Then calculate the test status, accounting for the updated state if the hook errored
        // to see if we should continue running the test.
        const status = test.calculateTestStatus()

        // If we have remaining attempts, inclusive of the beforeEach attempt if it failed, then the hook is retry-able
        isBeforeEachThatIsRetryable = isBeforeEachHook && status.shouldAttemptsContinue

        if (isAfterEachHook) {
          // If we have remaining attempts, inclusive of the afterEach attempt if it failed, then the hook is retry-able
          if (status.shouldAttemptsContinue) {
            isAfterEachThatIsRetryable = true
          } else if (!status.shouldAttemptsContinue && err) {
            /**
             * OR in the event the test attempt 'passed' and hit the exit condition,
             * BUT the afterEach hook errored which MIGHT change the test exit condition (as the test attempt is now 'failed')
             *
             * In this case, we need to see if we MIGHT have additional retries (maxRetries) available to reapply to satisfy
             * the test exit condition.
             *
             * Ex: This is important for 'detect-flake-but-always-fail' where stopIfAnyPassed=true, where the test itself might pass,
             * the exit condition is met, but THEN the 'afterEach' hook itself fails, which MIGHT change the exit conditions of the test
             * if there are remaining attempts that can be executed in order to satisfy the experimentalRetries configuration.
             *
             * To help with exit conditions on test skipping on repeated hook failures, test._retries
             * is set to retries made inside our mocha patch (./driver/patches/mocha+7.0.1.dev.patch), assuming a retry is made.
             * To show how many attempts are possible, we set '_maxRetries' to the total retries initially configured in order
             * to reference here in the case we might need to 'reset'.
             *
             * When we fall into this scenario, we need to 'reset' the mocha '_retries' in order to continue attempts
             * and requeue the test.
             */

            // Since this is the afterEach, we can assume the currentRetry has already run
            const canMoreAttemptsBeApplied = test._currentRetry === test._retries && test._currentRetry < test._maxRetries

            if (canMoreAttemptsBeApplied) {
              // The test in fact did NOT fit the exit condition because the 'afterEach' changed the status of the test.
              // Reset the retries to apply more attempts to possibly satisfy the test retry conditions.
              test._retries = test._maxRetries
              isAfterEachThatIsRetryable = true
            }
          }
        }
      }

      const willRetry = isBeforeEachThatIsRetryable || isAfterEachThatIsRetryable

      const isTestConfigOverride = !fired(TEST_BEFORE_RUN_EVENT, test)

      const fail = function () {
        return err
      }
      const noFail = function () {
        return
      }

      if (isTest) {
        // If there is no error on the test attempt, then the test attempt passed!
        // set a custom property on the test obj, hasTestAttemptPassed,
        // to inform mocha (through patch-package) that we need to re-attempt a passed test attempt
        // if experimentalRetries is enabled and there is at least one existing failure.
        runnable.hasAttemptPassed = !err
      }

      if (err) {
        if (willRetry) {
          test.final = false
          // If the test is being retried/re-attempted, delete the testStatusInfo metadata object if it is present
          // that determines outer status as it is no longer needed and contributes to additional properties on the
          // test runnable that are NOT needed.
          delete test._cypressTestStatusInfo
        }

        if (isTestConfigOverride) {
          // let the runner handle the error
          delete runnable.err
        }

        if ((willRetry || isTestConfigOverride) && isBeforeEachHook) {
          delete runnable.err
          test._retriesBeforeEachFailedTestFn = test.fn

          // this prevents afterEach hooks that exist at a deeper level than the failing one from running
          // we will always skip remaining beforeEach hooks since they will always be same level or deeper
          test._skipHooksWithLevelGreaterThan = runnable.titlePath().length

          setHookFailureProps(test, runnable, err)
          test.fn = function () {
            throw err
          }

          return noFail()
        }

        if (willRetry && isAfterEachHook) {
          // if we've already failed this attempt from an afterEach hook then we've already enqueued another attempt
          // so return early
          if (test._retriedFromAfterEachHook) {
            return noFail()
          }

          setHookFailureProps(test, runnable, err)

          const newTest = test.clone()

          newTest._currentRetry = test._currentRetry + 1

          // Check to see if the test attempt maybe passed, but hasn't satisfied its retry config yet and requeued itself.
          // In this case, we DON'T need to add the new test attempt as it is already queued to rerun.
          const testRetryThatMatches = test.parent.testsQueue.find((t) => t.id === newTest.id && t._currentRetry === newTest._currentRetry)

          if (!testRetryThatMatches) {
            test.parent.testsQueue.unshift(newTest)
          }

          // this prevents afterEach hooks that exist at a deeper (or same) level than the failing one from running
          test._skipHooksWithLevelGreaterThan = runnable.titlePath().length - 1
          test._retriedFromAfterEachHook = true

          Cypress.action('runner:retry', wrap(test), test.err)

          return noFail()
        }
      }

      return fail()
    }

    const createEmptyOnlyTest = (suite) => {
      const test = mocha.createTest('New Test', _.noop)

      test.id = getRunnableId()

      suite.addTest(test)
      suite.appendOnlyTest(test)

      test.invocationDetails = suite.invocationDetails

      setOnlyTestId(test.id)

      return test
    }

    return {
      onSpecError,
      setOnlyTestId,
      setOnlySuiteId,
      normalizeAll (tests, skipCollectingLogs, testFilter) {
        _skipCollectingLogs = skipCollectingLogs
        // if we have an uncaught error then slice out
        // all of the tests and suites and just generate
        // a single test since we received an uncaught
        // error prior to processing any of mocha's tests
        // which could have occurred in a separate support file
        if (_uncaughtFn) {
          _runner.suite.suites = []
          _runner.suite.tests = []
          // prevents .only on suite from hiding uncaught error
          _runner.suite._onlySuites = []

          // create a runnable to associate for the failure
          mocha.createRootTest('An uncaught error was detected outside of a test', _uncaughtFn)
        }

        return normalizeAll(
          _runner.suite,
          tests,
          testFilter,
          setTestsById,
          setTests,
          getRunnableId,
          getHookId,
          getOnlyTestId,
          getOnlySuiteId,
          createEmptyOnlyTest,
        )
      },

      run (fn) {
        if (_startTime == null) {
          _startTime = dayjs().toJSON()
        }

        _runnerListeners(_runner, Cypress, _emissions, getTestById, getTest, setTest, getTestFromHookOrFindTest)

        return _runner.run((failures) => {
          // if we happen to make it all the way through
          // the run, then just set _runner.stopped to true here
          _runner.stopped = true

          // remove all the listeners
          // so no more events fire
          // since a test failure may 'leak' after a run completes
          _runner.removeAllListeners()

          // TODO this functions is not correctly
          // synchronized with the 'end' event that
          // we manage because of uncaught hook errors
          if (fn) {
            return fn(failures, getTestResults(_tests))
          }
        })
      },

      onRunnableRun (runnableRun, runnable: CypressRunnable, args) {
        // extract out the next(fn) which mocha uses to
        // move to the next runnable - this will be our async seam
        const _next = args[0]

        // don't use getTest() here since hook runnables without tests should be skipped.
        // getTest() can be defined when a hook doesn't belong to the test.
        // see where we set currentTest in `_runner.on('hook'`
        const test = getTestFromRunnable(runnable)

        // if there's no test, this is likely a rouge before/after hook
        // that should not have run, so skip this runnable
        if (!test || _runner.stopped) {
          return _next()
        }

        // first time seeing a retried test
        // that hasn't already replaced our test
        if (test._currentRetry > 0 && _testsById[test.id] !== test) {
          replacePreviousAttemptWith(test)
        }

        // closure for calculating the actual
        // runtime of a runnables fn execution duration
        // and also the run of the runnable:after:run:async event
        let lifecycleStart
        let wallClockEnd: Date | null = null
        let fnDurationStart: Date | null = null
        let fnDurationEnd: Date | null = null
        let afterFnDurationStart: Date | null = null
        let afterFnDurationEnd: Date | null = null

        // when this is a hook, capture the real start
        // date so we can calculate our test's duration
        // including all of its hooks
        const wallClockStartedAt = new Date()

        if (!test.wallClockStartedAt) {
          // if we don't have lifecycle timings yet
          lifecycleStart = wallClockStartedAt
        }

        if (test.wallClockStartedAt == null) {
          test.wallClockStartedAt = wallClockStartedAt
        }

        const isHook = runnable.type === 'hook'

        let runnableName = 'test'
        let runnableId = runnable.id

        if (isHook) {
        // if this isn't a hook, then the name is 'test'
          runnableName = getHookName(runnable)

          // set hook id to hook id or test id
          runnableId = runnable.hookId

          const isAfterEachHook = runnableName.match(/after each/)
          const isBeforeEachHook = runnableName.match(/before each/)

          // if we've been told to skip hooks at a certain nested level
          // this happens if we're handling a runnable that is going to retry due to failing in a hook
          const shouldSkipRunnable = test._skipHooksWithLevelGreaterThan != null
          && (isBeforeEachHook || isAfterEachHook && runnable.titlePath().length > test._skipHooksWithLevelGreaterThan)

          if (shouldSkipRunnable) {
            return _next.call(this)
          }
        }

        const next = (err) => {
          // now set the duration of the after runnable run async event
          afterFnDurationEnd = (wallClockEnd = new Date())

          switch (runnable.type) {
            case 'hook':
              // reset runnable duration to include lifecycle
              // and afterFn timings purely for the mocha runner.
              // this is what it 'feels' like to the user
              runnable.duration = duration(wallClockEnd, wallClockStartedAt)

              setTestTimingsForHook(test, runnableName, {
                hookId: runnableId,
                fnDuration: duration(fnDurationEnd!, fnDurationStart!),
                afterFnDuration: duration(afterFnDurationEnd, afterFnDurationStart!),
              })

              break

            case 'test':
              // if we are currently on a test then
              // recalculate its duration to be based
              // against that (purely for the mocha reporter)
              test.duration = duration(wallClockEnd, test.wallClockStartedAt)

              // but still preserve its actual function
              // body duration for timings
              setTestTimings(test, runnableName, {
                fnDuration: duration(fnDurationEnd!, fnDurationStart!),
                afterFnDuration: duration(afterFnDurationEnd!, afterFnDurationStart!),
              })

              break

            default:
              break
          }

          return _next.call(runnable, err)
        }

        const onNext = (err) => {
          // when done with the function set that to end
          fnDurationEnd = new Date()

          // and also set the afterFnDuration to this same date
          afterFnDurationStart = fnDurationEnd

          // attach error right now
          // if we have one
          if (err) {
            const PendingErrorMessages = ['sync skip', 'sync skip; aborting execution', 'async skip call', 'async skip; aborting execution']

            if (_.find(PendingErrorMessages, err.message) !== undefined) {
              err.isPending = true
            }

            runnable.err = $errUtils.wrapErr(err)
          } else {
            // https://github.com/cypress-io/cypress/issues/9209
            // Mocha reuses runnable object. Because of that, runnable.err isn't undefined even when err is undefined.
            // It causes Cypress to take superfluous screenshots.
            delete runnable.err
          }

          err = maybeHandleRetryOnFailure(runnable, err)

          return runnableAfterRunAsync(runnable, Cypress)
          .then(() => {
            // once we complete callback with the
            // original err
            next(err)

            // return null here to signal to bluebird
            // that we did not forget to return a promise
            // because mocha internally does not return
            // the test.run(fn)
            return null
          }).catch((err) => {
            next(err)

            // return null here to signal to bluebird
            // that we did not forget to return a promise
            // because mocha internally does not return
            // the test.run(fn)
            return null
          })
        }

        // if either the TEST_BEFORE_RUN_EVENT or TEST_BEFORE_RUN_ASYNC_EVENT throws
        // then override the test function to associate the error to the test
        const handleBeforeTestEventError = (err: Error): boolean => {
          const { fn } = runnable

          runnable.fn = () => {
            runnable.fn = fn
            throw err
          }

          return false
        }

        // TODO: handle promise timeouts here!
        // whenever any runnable is about to run
        // we figure out what test its associated to
        // if its a hook, and then we fire the
        // test:before:run:async action if its not
        // been fired before for this test
        return Promise.try(() => {
          if (!fired(TEST_BEFORE_RUN_EVENT, test)) {
            cy.reset(test)
            test.slow(Cypress.config('slowTestThreshold'))
            test._retries = Cypress.getTestRetries() ?? -1
            fire(TEST_BEFORE_RUN_EVENT, test, Cypress)
          }

          return true
        })
        .catch(handleBeforeTestEventError)
        .then((ranSuccessfulBeforeRunEvent: boolean) => {
          cy.state('duringUserTestExecution', false)
          Cypress.primaryOriginCommunicator.toAllSpecBridges('sync:state', { 'duringUserTestExecution': false })

          // our runnable is about to run, so let cy know. this enables
          // us to always have a correct runnable set even when we are
          // running lifecycle events
          // and also get back a function result handler that we use as
          // an async seam
          cy.setRunnable(runnable, runnableId)

          if (ranSuccessfulBeforeRunEvent) {
            return testBeforeRunAsync(test, Cypress)
          }

          return null
        })
        .catch(handleBeforeTestEventError)
        .finally(() => {
          if (lifecycleStart) {
            // capture how long the lifecycle took as part
            // of the overall wallClockDuration of our test
            setTestTimings(test, 'lifecycle', duration(new Date(), lifecycleStart))
          }

          // capture the moment we're about to invoke
          // the runnable's callback function
          fnDurationStart = new Date()

          // call the original method with our
          // custom onNext function

          // this tells us we are now running test execution code
          // since all test:before:run:async listeners have completed
          cy.state('duringUserTestExecution', true)

          return runnableRun.call(runnable, onNext)
        })
      },

      getStartTime () {
        return _startTime
      },

      setStartTime (iso) {
        _startTime = iso
      },

      countByTestState (tests, state) {
        const count = _.filter(tests, (test, key) => {
          return test.state === state
        })

        return count.length
      },

      setNumLogs (num) {
        return LogUtils.setCounter(num)
      },

      getEmissions () {
        return _emissions
      },

      getTestsState () {
        const id = _test != null ? _test.id : undefined
        const tests = {}

        // bail if we dont have a current test
        if (!id) {
          return {}
        }

        // search through all of the tests
        // until we find the current test
        // and break then
        for (let testRunnable of _tests) {
          if (testRunnable.id === id) {
            break
          } else {
            const test = serializeTest(testRunnable)

            test.prevAttempts = _.map(testRunnable.prevAttempts, serializeTest)

            tests[test.id] = test
          }
        }

        return tests
      },

      stop () {
        if (_runner.stopped) {
          return
        }

        _runner.stopped = true

        // abort the run
        _runner.abort()

        // emit the final 'end' event
        // since our reporter depends on this event
        // and mocha may never fire this because our
        // runnable may never finish
        _runner.emit('end')

        // remove all the listeners
        // so no more events fire
        _runner.removeAllListeners()
      },

      getDisplayPropsForLog: LogUtils.getDisplayProps,
      getProtocolPropsForLog: LogUtils.getProtocolProps,

      getConsolePropsForLog (testId, logId) {
        if (_skipCollectingLogs) return

        const test = getTestById(testId)

        if (!test) return

        const logAttrs = _.find(test.commands || [], (log) => log.id === logId)

        if (logAttrs) {
          if (logAttrs._hasBeenCleanedUp) {
            return { Message: `The command details and snapshot has been cleaned up to reduce the number of tests in memory.` }
          }

          return LogUtils.getConsoleProps(logAttrs)
        }

        return
      },

      getSnapshotPropsForLog (testId, logId) {
        if (_skipCollectingLogs) return

        const test = getTestById(testId)

        if (!test) return

        const logAttrs = _.find(test.commands || [], (log) => log.id === logId)

        if (logAttrs) {
          return LogUtils.getSnapshotProps(logAttrs)
        }

        return
      },

      resumeAtTest (id, emissions: Emissions = {
        started: {},
        ended: {},
      }) {
        _resumedAtTestIndex = getTestIndexFromId(id)

        _emissions = emissions

        for (let test of _tests) {
          if (getTestIndexFromId(test.id) !== _resumedAtTestIndex) {
            test._ALREADY_RAN = true
            test.pending = true
          } else {
            // bail so we can stop now
            return
          }
        }
      },

      getResumedAtTestIndex () {
        return _resumedAtTestIndex
      },

      cleanupQueue (numTestsKeptInMemory) {
        const cleanup = (queue) => {
          if (queue.length > numTestsKeptInMemory) {
            const test = queue.shift()

            delete _testsQueueById[test.id]

            _.each(RUNNABLE_LOGS, (logs) => {
              return _.each(test[logs], (attrs) => {
                // we know our attrs have been cleaned
                // now, so lets store that
                attrs._hasBeenCleanedUp = true

                return LogUtils.reduceMemory(attrs)
              })
            })

            return cleanup(queue)
          }
        }

        return cleanup(_testsQueue)
      },

      addLog (attrs, isInteractive) {
        // we don't need to hold a log reference to anything in memory when we don't
        // render the report or are headless because you cannot inspect any logs
        if (_skipCollectingLogs || !isInteractive) {
          return
        }

        let test = getTestById(attrs.testId)

        // bail if for whatever reason we
        // cannot associate this log to a test
        if (!test) {
          return
        }

        // if this test isn't in the current queue
        // then go ahead and add it
        if (!_testsQueueById[test.id]) {
          _testsQueueById[test.id] = true
          _testsQueue.push(test)
        }

        const { instrument } = attrs

        // pluralize the instrument as a property on the runnable
        const name = `${instrument}s`
        const logs = test[name] != null ? test[name] : (test[name] = [])

        const existing = _.find(logs, (log) => log.id === attrs.id)

        if (existing) {
          // because log:state:changed may
          // fire at a later time, its possible
          // we've already cleaned up these attrs
          // and in that case we don't want to do
          // anything at all
          if (existing._hasBeenCleanedUp) {
            return
          }

          // mutate the existing object
          return _.extend(existing, attrs)
        }

        return logs.push(attrs)
      },
    }
  },
}

const mixinLogs = (test) => {
  _.each(RUNNABLE_LOGS, (type) => {
    const logs = test[type]

    if (logs) {
      test[type] = _.map(logs, LogUtils.toSerializedJSON)
    }
  })
}

const serializeTest = (test) => {
  const wrappedTest = wrapAll(test)

  mixinLogs(wrappedTest)

  return wrappedTest
}
