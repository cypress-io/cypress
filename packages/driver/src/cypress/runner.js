/* eslint-disable prefer-rest-params */
/* globals Cypress */
const _ = require('lodash')
const moment = require('moment')
const Promise = require('bluebird')
const Pending = require('mocha/lib/pending')

const $Log = require('./log')
const $utils = require('./utils')
const $errUtils = require('./error_utils')
const $stackUtils = require('./stack_utils')

const mochaCtxKeysRe = /^(_runnable|test)$/
const betweenQuotesRe = /\"(.+?)\"/

const HOOKS = 'beforeAll beforeEach afterEach afterAll'.split(' ')
const TEST_BEFORE_RUN_EVENT = 'runner:test:before:run'
const TEST_AFTER_RUN_EVENT = 'runner:test:after:run'

const RUNNABLE_LOGS = 'routes agents commands hooks'.split(' ')
const RUNNABLE_PROPS = 'id order title root hookName hookId err state failedFromHookId body speed type duration wallClockStartedAt wallClockDuration timings file originalTitle invocationDetails final currentRetry retries'.split(' ')

const debug = require('debug')('cypress:driver:runner')

const fire = (event, runnable, Cypress) => {
  debug('fire: %o', { event })
  if (runnable._fired == null) {
    runnable._fired = {}
  }

  runnable._fired[event] = true

  // dont fire anything again if we are skipped
  if (runnable._ALREADY_RAN) {
    return
  }

  return Cypress.action(event, wrap(runnable), runnable)
}

const fired = (event, runnable) => {
  return !!(runnable._fired && runnable._fired[event])
}

const testBeforeRunAsync = (test, Cypress) => {
  return Promise.try(() => {
    if (!fired('runner:test:before:run:async', test)) {
      return fire('runner:test:before:run:async', test, Cypress)
    }
  })
}

const runnableAfterRunAsync = (runnable, Cypress) => {
  runnable.clearTimeout()

  return Promise.try(() => {
    // NOTE: other events we do not fire more than once, but this needed to change for test-retries
    return fire('runner:runnable:after:run:async', runnable, Cypress)
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
      // TODO: revist when we handle uncaught exceptions/rejections between tests
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
  return test.wallClockDuration = new Date() - test.wallClockStartedAt
}

// we need to optimize wrap by converting
// tests to an id-based object which prevents
// us from recursively iterating through every
// parent since we could just return the found test
const wrap = (runnable) => {
  return $utils.reduceProps(runnable, RUNNABLE_PROPS)
}

const wrapAll = (runnable) => {
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
const findTestInSuite = (suite, fn = _.identity) => {
  for (const test of suite.tests) {
    if (fn(test)) {
      return test
    }
  }

  for (suite of suite.suites) {
    const test = findTestInSuite(suite, fn)

    if (test) {
      return test
    }
  }
}

// same as findTestInSuite but iterates backwards
const findLastTestInSuite = (suite, fn = _.identity) => {
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
  const tests = []

  suite.eachTest((testRunnable) => {
    // iterate through each of our suites tests.
    // this will iterate through all nested tests
    // as well.  and then we add it only if its
    // in our filtered tests array
    const test = getTestById(testRunnable.id)

    if (test) {
      return tests.push(test)
    }
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
  const suites = _.reduce(tests, (memo, test) => {
    let parent

    while ((parent = test.parent)) {
      memo.push(parent)
      test = parent
    }

    return memo
  }
  , [])

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

const isLastTest = (test, tests) => {
  return test.id === _.get(_.last(tests), 'id')
}

const isRootSuite = (suite) => {
  return suite && suite.root
}

const overrideRunnerHook = (Cypress, _runner, getTestById, getTest, setTest, getTests) => {
  // bail if our _runner doesnt have a hook.
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

    let shouldFireTestAfterRun = _.noop

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
        }

        break

      case 'afterAll':
        shouldFireTestAfterRun = () => {
          // find all of the filtered allTests which share
          // the same parent suite as our current _test
          // const t = getTest()

          if (test) {
            const siblings = getAllSiblingTests(test.parent, getTestById)

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
        }

        break

      default:
        break
    }

    const newArgs = [name, $utils.monkeypatchBefore(fn,
      function () {
        if (!shouldFireTestAfterRun()) return

        setTest(null)

        if (test.final !== false) {
          test.final = true
          if (test.state === 'passed') {
            Cypress.action('runner:pass', wrap(test))
          }

          Cypress.action('runner:test:end', wrap(test))

          _runner._shouldBufferSuiteEnd = false
          _runner._onTestAfterRun.map((fn) => {
            return fn()
          })

          _runner._onTestAfterRun = []
        }

        testAfterRun(test, Cypress)
      })]

    return newArgs
  })
}

const getTestResults = (tests) => {
  return _.map(tests, (test) => {
    const obj = _.pick(test, 'id', 'duration', 'state')

    obj.title = test.originalTitle
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

const normalizeAll = (suite, initialTests = {}, setTestsById, setTests, onRunnable, onLogsById, getTestId, getHookId) => {
  let hasTests = false

  // only loop until we find the first test
  findTestInSuite(suite, (test) => {
    return hasTests = true
  })

  // if we dont have any tests then bail
  if (!hasTests) {
    return
  }

  // we are doing a super perf loop here where
  // we hand back a normalized object but also
  // create optimized lookups for the tests without
  // traversing through it multiple times
  const tests = {}
  const normalizedSuite = normalize(suite, tests, initialTests, onRunnable, onLogsById, getTestId, getHookId)

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

  return normalizedSuite
}

const normalize = (runnable, tests, initialTests, onRunnable, onLogsById, getTestId, getHookId) => {
  const normalizeRunnable = (runnable) => {
    runnable.id = getTestId()

    // tests have a type of 'test' whereas suites do not have a type property
    if (runnable.type == null) {
      runnable.type = 'suite'
    }

    if (onRunnable) {
      onRunnable(runnable)
    }

    // if we have a runnable in the initial state
    // then merge in existing properties into the runnable
    const i = initialTests[runnable.id]

    let prevAttempts

    if (i) {
      prevAttempts = []

      if (i.prevAttempts) {
        prevAttempts = _.map(i.prevAttempts, (test) => {
          if (test) {
            _.each(RUNNABLE_LOGS, (type) => {
              return _.each(test[type], onLogsById)
            })
          }

          // reduce this runnable down to its props
          // and collections
          return wrapAll(test)
        })
      }

      _.each(RUNNABLE_LOGS, (type) => {
        return _.each(i[type], onLogsById)
      })

      _.extend(runnable, i)
    }

    // merge all hooks into single array
    runnable.hooks = condenseHooks(runnable, getHookId)

    // reduce this runnable down to its props
    // and collections
    const test = wrapAll(runnable)

    if (prevAttempts) {
      test.prevAttempts = prevAttempts
    }

    return test
  }

  const push = (test) => {
    return tests[test.id] != null ? tests[test.id] : (tests[test.id] = test)
  }

  const normalizedRunnable = normalizeRunnable(runnable)

  if ((runnable.type !== 'suite') || !hasOnly(runnable)) {
    if (runnable.type === 'test') {
      push(runnable)
    }

    // recursively iterate and normalize all other _runnables
    _.each({ tests: runnable.tests, suites: runnable.suites }, (_runnables, type) => {
      if (runnable[type]) {
        return normalizedRunnable[type] = _.map(_runnables, (runnable) => {
          return normalize(runnable, tests, initialTests, onRunnable, onLogsById, getTestId, getHookId)
        })
      }
    })

    return normalizedRunnable
  }

  // this follows how mocha filters onlys. its runner#filterOnly
  // is pretty much the same minus the normalization part
  const filterOnly = (normalizedSuite, suite) => {
    if (suite._onlyTests.length) {
      suite.tests = suite._onlyTests
      normalizedSuite.tests = _.map(suite._onlyTests, (test) => {
        const normalizedTest = normalizeRunnable(test, initialTests, onRunnable, onLogsById, getTestId, getHookId)

        push(test)

        return normalizedTest
      })

      suite.suites = []
      normalizedSuite.suites = []
    } else {
      suite.tests = []
      normalizedSuite.tests = []
      _.each(suite._onlySuites, (onlySuite) => {
        const normalizedOnlySuite = normalizeRunnable(onlySuite, initialTests, onRunnable, onLogsById, getTestId, getHookId)

        if (hasOnly(onlySuite)) {
          return filterOnly(normalizedOnlySuite, onlySuite)
        }
      })

      suite.suites = _.filter(suite.suites, (childSuite) => {
        const normalizedChildSuite = normalizeRunnable(childSuite, initialTests, onRunnable, onLogsById, getTestId, getHookId)

        return (suite._onlySuites.indexOf(childSuite) !== -1) || filterOnly(normalizedChildSuite, childSuite)
      })

      normalizedSuite.suites = _.map(suite.suites, (childSuite) => normalize(childSuite, tests, initialTests, onRunnable, onLogsById, getTestId, getHookId))
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

const _runnerListeners = (_runner, Cypress, _emissions, getTestById, getTest, setTest, getHookId, getTestFromHookOrFindTest) => {
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

    // https://github.com/cypress-io/cypress/issues/9162
    // In https://github.com/cypress-io/cypress/issues/8113, getTest() call was removed to handle skip() properly.
    // But it caused tests to hang when there's a failure in before().
    // That's why getTest() is revived and checks if the state is 'pending'.
    if (!test || test.state === 'pending') {
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

      // append a friendly message to the error indicating
      // we're skipping the remaining tests in this suite
      err = $errUtils.appendErrMsg(
        err,
        $errUtils.errByPath('uncaught.error_in_hook', {
          parentTitle,
          hookName,
          retries: test._retries,
        }).message,
      )
    }

    // always set runnable err so we can tap into
    // taking a screenshot on error
    runnable.err = $errUtils.wrapErr(err)

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

const create = (specWindow, mocha, Cypress, cy) => {
  let _id = 0
  let _hookId = 0
  let _uncaughtFn = null
  let _resumedAtTestIndex = null

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

  const onScriptError = (err) => {
    // err will not be returned if cy can associate this
    // uncaught exception to an existing runnable
    if (!err) {
      return true
    }

    const todoMsg = () => {
      if (!Cypress.config('isTextTerminal')) {
        return 'Check your console for the stack trace or click this message to see where it originated from.'
      }
    }

    const appendMsg = _.chain([
      'Cypress could not associate this error to any specific test.',
      'We dynamically generated a new test to display this failure.',
      todoMsg(),
    ])
    .compact()
    .join('\n\n')
    .value()

    err = $errUtils.appendErrMsg(err, appendMsg)

    const throwErr = () => {
      throw err
    }

    // we could not associate this error
    // and shouldn't ever start our run
    _uncaughtFn = throwErr

    // return undefined so the browser does its default
    // uncaught exception behavior (logging to console)
    return undefined
  }

  specWindow.onerror = function () {
    const err = cy.onSpecWindowUncaughtException.apply(cy, arguments)

    return onScriptError(err)
  }

  // hold onto the _runnables for faster lookup later
  let _test = null
  let _tests = []
  let _testsById = {}
  const _testsQueue = []
  const _testsQueueById = {}
  // only used during normalization
  const _runnables = []
  const _logsById = {}
  let _emissions = {
    started: {},
    ended: {},
  }
  let _startTime = null

  // increment the id counter
  const getTestId = () => {
    return `r${_id += 1}`
  }

  const getHookId = () => {
    return `h${_hookId += 1}`
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

  const onRunnable = (r) => {
    // set defualt retries at onRunnable time instead of onRunnableRun
    return _runnables.push(r)
  }

  const onLogsById = (l) => {
    return _logsById[l.id] = l
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

  const replaceRunnable = (runnable, id) => {
    const testsQueueIndex = _.findIndex(_testsQueue, { id })

    _testsQueue.splice(testsQueueIndex, 1, runnable)

    _testsQueueById[id] = runnable

    const testsIndex = _.findIndex(_tests, { id })

    _tests.splice(testsIndex, 1, runnable)

    _testsById[id] = runnable
  }

  overrideRunnerHook(Cypress, _runner, getTestById, getTest, setTest, getTests)

  // this forces mocha to enqueue a duplicate test in the case of test retries
  const replacePreviousAttemptWith = (test) => {
    const prevAttempt = _testsById[test.id]

    const prevAttempts = prevAttempt.prevAttempts || []

    const newPrevAttempts = prevAttempts.concat([prevAttempt])

    delete prevAttempt.prevAttempts

    test.prevAttempts = newPrevAttempts

    replaceRunnable(test, test.id)
  }

  const maybeHandleRetry = (runnable, err) => {
    if (!err) return

    const r = runnable
    const isHook = r.type === 'hook'
    const isTest = r.type === 'test'
    const test = getTest() || getTestFromHook(runnable, getTestById)
    const hookName = isHook && getHookName(r)
    const isBeforeEachHook = isHook && !!hookName.match(/before each/)
    const isAfterEachHook = isHook && !!hookName.match(/after each/)
    const retryAbleRunnable = isTest || isBeforeEachHook || isAfterEachHook
    const willRetry = (test._currentRetry < test._retries) && retryAbleRunnable

    const fail = function () {
      return err
    }
    const noFail = function () {
      return
    }

    if (err) {
      if (willRetry) {
        test.state = 'failed'
        test.final = false
      }

      if (willRetry && isBeforeEachHook) {
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
        // if we've already failed this attempt from an afterEach hook then we've already enqueud another attempt
        // so return early
        if (test._retriedFromAfterEachHook) {
          return noFail()
        }

        setHookFailureProps(test, runnable, err)

        const newTest = test.clone()

        newTest._currentRetry = test._currentRetry + 1

        test.parent.testsQueue.unshift(newTest)

        // this prevents afterEach hooks that exist at a deeper (or same) level than the failing one from running
        test._skipHooksWithLevelGreaterThan = runnable.titlePath().length - 1
        test._retriedFromAfterEachHook = true

        Cypress.action('runner:retry', wrap(test), test.err)

        return noFail()
      }
    }

    return fail()
  }

  return {
    onScriptError,

    normalizeAll (tests) {
      // if we have an uncaught error then slice out
      // all of the tests and suites and just generate
      // a single test since we received an uncaught
      // error prior to processing any of mocha's tests
      // which could have occurred in a separate support file
      if (_uncaughtFn) {
        _runner.suite.suites = []
        _runner.suite.tests = []

        // create a runnable to associate for the failure
        mocha.createRootTest('An uncaught error was detected outside of a test', _uncaughtFn)
      }

      return normalizeAll(
        _runner.suite,
        tests,
        setTestsById,
        setTests,
        onRunnable,
        onLogsById,
        getTestId,
        getHookId,
      )
    },

    run (fn) {
      if (_startTime == null) {
        _startTime = moment().toJSON()
      }

      _runnerListeners(_runner, Cypress, _emissions, getTestById, getTest, setTest, getHookId, getTestFromHookOrFindTest)

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

    onRunnableRun (runnableRun, runnable, args) {
      // extract out the next(fn) which mocha uses to
      // move to the next runnable - this will be our async seam
      const _next = args[0]

      const test = getTest() || getTestFromRunnable(runnable)

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
      // runtime of a runnables fn exection duration
      // and also the run of the runnable:after:run:async event
      let lifecycleStart
      let wallClockStartedAt = null
      let wallClockEnd = null
      let fnDurationStart = null
      let fnDurationEnd = null
      let afterFnDurationStart = null
      let afterFnDurationEnd = null

      // when this is a hook, capture the real start
      // date so we can calculate our test's duration
      // including all of its hooks
      wallClockStartedAt = new Date()

      if (!test.wallClockStartedAt) {
        // if we don't have lifecycle timings yet
        lifecycleStart = wallClockStartedAt
      }

      if (test.wallClockStartedAt == null) {
        test.wallClockStartedAt = wallClockStartedAt
      }

      // if this isnt a hook, then the name is 'test'
      const hookName = runnable.type === 'hook' ? getHookName(runnable) : 'test'

      // set hook id to hook id or test id
      const hookId = runnable.type === 'hook' ? runnable.hookId : runnable.id

      // if we haven't yet fired this event for this test
      // that means that we need to reset the previous state
      // of cy - since we now have a new 'test' and all of the
      // associated _runnables will share this state
      if (!fired(TEST_BEFORE_RUN_EVENT, test)) {
        fire(TEST_BEFORE_RUN_EVENT, test, Cypress)

        // this is the earliest we can set test._retries since test:before:run
        // will load in testConfigOverrides (per test configuration)
        const retries = Cypress.getTestRetries() ?? -1

        test._retries = retries
      }

      const isHook = runnable.type === 'hook'

      const isAfterEachHook = isHook && hookName.match(/after each/)
      const isBeforeEachHook = isHook && hookName.match(/before each/)

      // if we've been told to skip hooks at a certain nested level
      // this happens if we're handling a runnable that is going to retry due to failing in a hook
      const shouldSkipRunnable = test._skipHooksWithLevelGreaterThan != null
        && isHook
        && (isBeforeEachHook || isAfterEachHook && runnable.titlePath().length > test._skipHooksWithLevelGreaterThan)

      if (shouldSkipRunnable) {
        return _next.call(this)
      }

      const next = (err) => {
        // now set the duration of the after runnable run async event
        afterFnDurationEnd = (wallClockEnd = new Date())

        switch (runnable.type) {
          case 'hook':
            // reset runnable duration to include lifecycle
            // and afterFn timings purely for the mocha runner.
            // this is what it 'feels' like to the user
            runnable.duration = wallClockEnd - wallClockStartedAt

            setTestTimingsForHook(test, hookName, {
              hookId: runnable.hookId,
              fnDuration: fnDurationEnd - fnDurationStart,
              afterFnDuration: afterFnDurationEnd - afterFnDurationStart,
            })

            break

          case 'test':
            // if we are currently on a test then
            // recalculate its duration to be based
            // against that (purely for the mocha reporter)
            test.duration = wallClockEnd - test.wallClockStartedAt

            // but still preserve its actual function
            // body duration for timings
            setTestTimings(test, 'test', {
              fnDuration: fnDurationEnd - fnDurationStart,
              afterFnDuration: afterFnDurationEnd - afterFnDurationStart,
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
          if (err instanceof Pending) {
            err.isPending = true
          }

          runnable.err = $errUtils.wrapErr(err)
        }

        err = maybeHandleRetry(runnable, err)

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

      // our runnable is about to run, so let cy know. this enables
      // us to always have a correct runnable set even when we are
      // running lifecycle events
      // and also get back a function result handler that we use as
      // an async seam
      cy.setRunnable(runnable, hookId)

      // TODO: handle promise timeouts here!
      // whenever any runnable is about to run
      // we figure out what test its associated to
      // if its a hook, and then we fire the
      // test:before:run:async action if its not
      // been fired before for this test
      return testBeforeRunAsync(test, Cypress)
      .catch((err) => {
        // TODO: if our async tasks fail
        // then allow us to cause the test
        // to fail here by blowing up its fn
        // callback
        const { fn } = runnable

        const restore = () => {
          return runnable.fn = fn
        }

        runnable.fn = () => {
          restore()

          throw err
        }
      }).finally(() => {
        if (lifecycleStart) {
          // capture how long the lifecycle took as part
          // of the overall wallClockDuration of our test
          setTestTimings(test, 'lifecycle', new Date() - lifecycleStart)
        }

        // capture the moment we're about to invoke
        // the runnable's callback function
        fnDurationStart = new Date()

        // call the original method with our
        // custom onNext function
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
      return $Log.setCounter(num)
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
      // and mocha may never fire this becuase our
      // runnable may never finish
      _runner.emit('end')

      // remove all the listeners
      // so no more events fire
      _runner.removeAllListeners()
    },

    getDisplayPropsForLog: $Log.getDisplayProps,

    getConsolePropsForLogById (logId) {
      const attrs = _logsById[logId]

      if (attrs) {
        return $Log.getConsoleProps(attrs)
      }
    },

    getSnapshotPropsForLogById (logId) {
      const attrs = _logsById[logId]

      if (attrs) {
        return $Log.getSnapshotProps(attrs)
      }
    },

    resumeAtTest (id, emissions = {}) {
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

              return $Log.reduceMemory(attrs)
            })
          })

          return cleanup(queue)
        }
      }

      return cleanup(_testsQueue)
    },

    addLog (attrs, isInteractive) {
      // we dont need to hold a log reference
      // to anything in memory when we're headless
      // because you cannot inspect any logs

      if (!isInteractive) {
        return
      }

      let test = getTestById(attrs.testId)

      // bail if for whatever reason we
      // cannot associate this log to a test
      if (!test) {
        return
      }

      // if this test isnt in the current queue
      // then go ahead and add it
      if (!_testsQueueById[test.id]) {
        _testsQueueById[test.id] = true
        _testsQueue.push(test)
      }

      const existing = _logsById[attrs.id]

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

      _logsById[attrs.id] = attrs

      const { testId, instrument } = attrs

      test = getTestById(testId)

      if (test) {
        // pluralize the instrument
        // as a property on the runnable
        let name
        const logs = test[name = `${instrument}s`] != null ? test[name] : (test[name] = [])

        // else push it onto the logs
        return logs.push(attrs)
      }
    },
  }
}

const mixinLogs = (test) => {
  _.each(RUNNABLE_LOGS, (type) => {
    const logs = test[type]

    if (logs) {
      test[type] = _.map(logs, $Log.toSerializedJSON)
    }
  })
}

const serializeTest = (test) => {
  const wrappedTest = wrapAll(test)

  mixinLogs(wrappedTest)

  return wrappedTest
}

module.exports = {
  create,
}
