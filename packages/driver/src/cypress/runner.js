/* eslint-disable prefer-rest-params */
/* globals Cypress */
const _ = require('lodash')
const moment = require('moment')
const Promise = require('bluebird')
const Pending = require('mocha/lib/pending')

const $Log = require('./log')
const $utils = require('./utils')
const $errUtils = require('./error_utils')

const mochaCtxKeysRe = /^(_runnable|test)$/
const betweenQuotesRe = /\"(.+?)\"/

const HOOKS = 'beforeAll beforeEach afterEach afterAll'.split(' ')
const TEST_BEFORE_RUN_EVENT = 'runner:test:before:run'
const TEST_AFTER_RUN_EVENT = 'runner:test:after:run'

const RUNNABLE_LOGS = 'routes agents commands'.split(' ')
const RUNNABLE_PROPS = 'id order title root hookName hookId err state failedFromHookId body speed type duration wallClockStartedAt wallClockDuration timings file'.split(' ')

const debug = require('debug')('cypress:driver:runner')
// ## initial payload
// {
//   suites: [
//     {id: "r1"}, {id: "r4", suiteId: "r1"}
//   ]
//   tests: [
//     {id: "r2", title: "foo", suiteId: "r1"}
//   ]
// }

// ## normalized
// {
//   {
//     root: true
//     suites: []
//     tests: []
//   }
// }

// ## resetting state (get back from server)
// {
//   scrollTop: 100
//   tests: {
//     r2: {id: "r2", title: "foo", suiteId: "r1", state: "passed", err: "", routes: [
//         {}, {}
//       ]
//       agents: [
//       ]
//       commands: [
//         {}, {}, {}
//       ]
//     }}
//
//     r3: {id: "r3", title: "bar", suiteId: "r1", state: "failed", logs: {
//       routes: [
//         {}, {}
//       ]
//       spies: [
//       ]
//       commands: [
//         {}, {}, {}
//       ]
//     }}
//   ]
// }

const fire = function (event, runnable, Cypress) {
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

const runnableAfterRunAsync = function (runnable, Cypress) {
  runnable.clearTimeout()

  return Promise.try(() => {
    if (!fired('runner:runnable:after:run:async', runnable)) {
      return fire('runner:runnable:after:run:async', runnable, Cypress)
    }
  })
}

const testAfterRun = function (test, Cypress) {
  test.clearTimeout()
  if (!fired(TEST_AFTER_RUN_EVENT, test)) {
    setWallClockDuration(test)
    fire(TEST_AFTER_RUN_EVENT, test, Cypress)

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
    test.fn = function () {}

    // prevent loop comprehension
    return null
  }
}

const setTestTimingsForHook = function (test, hookName, obj) {
  if (test.timings == null) {
    test.timings = {}
  }

  if (test.timings[hookName] == null) {
    test.timings[hookName] = []
  }

  return test.timings[hookName].push(obj)
}

const setTestTimings = function (test, name, obj) {
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

const getHookName = function (hook) {
  // find the name of the hook by parsing its
  // title and pulling out whats between the quotes
  const name = hook.title.match(betweenQuotesRe)

  return name && name[1]
}

const forceGc = function (obj) {
  // aggressively forces GC by purging
  // references to ctx, and removes callback
  // functions for closures
  for (let key of Object.keys(obj.ctx || {})) {
    obj.ctx[key] = undefined
  }

  if (obj.fn) {
    obj.fn = function () {}
  }
}

const eachHookInSuite = function (suite, fn) {
  for (let type of HOOKS) {
    for (let hook of suite[`_${type}`]) {
      fn(hook)
    }
  }

  // prevent loop comprehension
  return null
}

const onFirstTest = function (suite, fn) {
  let test

  for (test of suite.tests) {
    if (fn(test)) {
      return test
    }
  }

  for (suite of suite.suites) {
    test = onFirstTest(suite, fn)

    if (test) {
      return test
    }
  }
}

const getAllSiblingTests = function (suite, getTestById) {
  const tests = []

  suite.eachTest((test) => {
    // iterate through each of our suites tests.
    // this will iterate through all nested tests
    // as well.  and then we add it only if its
    // in our filtered tests array
    if (getTestById(test.id)) {
      return tests.push(test)
    }
  })

  return tests
}

const getTestFromHook = function (hook, suite, getTestById) {
  // if theres already a currentTest use that
  let found; let test

  test = hook != null ? hook.ctx.currentTest : undefined

  if (test) {
    return test
  }

  // if we have a hook id then attempt
  // to find the test by its id
  if (hook != null ? hook.id : undefined) {
    found = onFirstTest(suite, (test) => {
      return hook.id === test.id
    })

    if (found) {
      return found
    }
  }

  // returns us the very first test
  // which is in our filtered tests array
  // based on walking down the current suite
  // iterating through each test until it matches
  found = onFirstTest(suite, (test) => {
    return getTestById(test.id)
  })

  if (found) {
    return found
  }

  // have one last final fallback where
  // we just return true on the very first
  // test (used in testing)
  return onFirstTest(suite, (test) => {
    return true
  })
}

// we have to see if this is the last suite amongst
// its siblings.  but first we have to filter out
// suites which dont have a filtered test in them
const isLastSuite = function (suite, tests) {
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
  return test === _.last(tests)
}

const isRootSuite = (suite) => {
  return suite && suite.root
}

const overrideRunnerHook = function (Cypress, _runner, getTestById, getTest, setTest, getTests) {
  // bail if our _runner doesnt have a hook.
  // useful in tests
  if (!_runner.hook) {
    return
  }

  // monkey patch the hook event so we can wrap
  // 'test:after:run' around all of
  // the hooks surrounding a test runnable
  const _runnerHook = _runner.hook

  _runner.hook = function (name, fn) {
    const allTests = getTests()

    const changeFnToRunAfterHooks = function () {
      const originalFn = fn

      const test = getTest()

      fn = function () {
        setTest(null)

        testAfterRun(test, Cypress)

        // and now invoke next(err)
        return originalFn.apply(window, arguments)
      }
    }

    switch (name) {
      case 'afterEach': {
        const t = getTest()

        // find all of the filtered _tests which share
        // the same parent suite as our current _test
        const tests = getAllSiblingTests(t.parent, getTestById)

        // make sure this test isnt the last test overall but also
        // isnt the last test in our filtered parent suite's tests array
        if (this.suite.root && (t !== _.last(allTests)) && (t !== _.last(tests))) {
          changeFnToRunAfterHooks()
        }

        break
      }

      case 'afterAll': {
        // find all of the filtered allTests which share
        // the same parent suite as our current _test
        const t = getTest()

        if (t) {
          const siblings = getAllSiblingTests(t.parent, getTestById)

          // 1. if we're the very last test in the entire allTests
          //    we wait until the root suite fires
          // 2. else we wait until the very last possible moment by waiting
          //    until the root suite is the parent of the current suite
          //    since that will bubble up IF we're the last nested suite
          // 3. else if we arent the last nested suite we fire if we're
          //    the last test that will run
          if (
            (isRootSuite(this.suite) && isLastTest(t, allTests)) ||
              (isRootSuite(this.suite.parent) && lastTestThatWillRunInSuite(t, siblings)) ||
              (!isLastSuite(this.suite, allTests) && lastTestThatWillRunInSuite(t, siblings))
          ) {
            changeFnToRunAfterHooks()
          }
        }

        break
      }

      default:
        break
    }

    return _runnerHook.call(this, name, fn)
  }
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

const normalizeAll = (suite, initialTests = {}, setTestsById, setTests, onRunnable, onLogsById, getTestId) => {
  let hasTests = false

  // only loop until we find the first test
  onFirstTest(suite, (test) => {
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
  const normalizedSuite = normalize(suite, tests, initialTests, onRunnable, onLogsById, getTestId)

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

const normalize = (runnable, tests, initialTests, onRunnable, onLogsById, getTestId) => {
  const normalizeRunnable = (runnable) => {
    let i

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
    i = initialTests[runnable.id]
    if (i) {
      _.each(RUNNABLE_LOGS, (type) => {
        return _.each(i[type], onLogsById)
      })

      _.extend(runnable, i)
    }

    // reduce this runnable down to its props
    // and collections
    return wrapAll(runnable)
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
          return normalize(runnable, tests, initialTests, onRunnable, onLogsById, getTestId)
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
        const normalizedTest = normalizeRunnable(test, initialTests, onRunnable, onLogsById, getTestId)

        push(normalizedTest)

        return normalizedTest
      })

      suite.suites = []
      normalizedSuite.suites = []
    } else {
      suite.tests = []
      normalizedSuite.tests = []
      _.each(suite._onlySuites, (onlySuite) => {
        const normalizedOnlySuite = normalizeRunnable(onlySuite, initialTests, onRunnable, onLogsById, getTestId)

        if (hasOnly(onlySuite)) {
          return filterOnly(normalizedOnlySuite, onlySuite)
        }
      })

      suite.suites = _.filter(suite.suites, (childSuite) => {
        const normalizedChildSuite = normalizeRunnable(childSuite, initialTests, onRunnable, onLogsById, getTestId)

        return (suite._onlySuites.indexOf(childSuite) !== -1) || filterOnly(normalizedChildSuite, childSuite)
      })

      normalizedSuite.suites = _.map(suite.suites, (childSuite) => normalize(childSuite, tests, initialTests, onRunnable, onLogsById, getTestId))
    }

    return suite.tests.length || suite.suites.length
  }

  filterOnly(normalizedRunnable, runnable)

  return normalizedRunnable
}

const hookFailed = function (hook, err, hookName, getTestById, getTest) {
  // finds the test by returning the first test from
  // the parent or looping through the suites until
  // it finds the first test
  const test = getTest() || getTestFromHook(hook, hook.parent, getTestById)

  test.err = err
  test.state = 'failed'
  test.duration = hook.duration // TODO: nope (?)
  test.hookName = hookName // TODO: why are we doing this?
  test.failedFromHookId = hook.hookId

  if (hook.alreadyEmittedMocha) {
    test.alreadyEmittedMocha = true
  } else {
    return Cypress.action('runner:test:end', wrap(test))
  }
}

const _runnerListeners = function (_runner, Cypress, _emissions, getTestById, getTest, setTest, getHookId) {
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

  _runner.on('suite end', (suite) => {
    // cleanup our suite + its hooks
    forceGc(suite)
    eachHookInSuite(suite, forceGc)

    if (_emissions.ended[suite.id]) {
      return
    }

    _emissions.ended[suite.id] = true

    return Cypress.action('runner:suite:end', wrap(suite))
  })

  _runner.on('hook', (hook) => {
    if (hook.hookId == null) {
      hook.hookId = getHookId()
    }

    if (hook.hookName == null) {
      hook.hookName = getHookName(hook)
    }

    // mocha incorrectly sets currentTest on before all's.
    // if there is a nested suite with a before, then
    // currentTest will refer to the previous test run
    // and not our current
    if ((hook.hookName === 'before all') && hook.ctx.currentTest) {
      delete hook.ctx.currentTest
    }

    // set the hook's id from the test because
    // hooks do not have their own id, their
    // commands need to grouped with the test
    // and we can only associate them by this id
    const test = getTest() || getTestFromHook(hook, hook.parent, getTestById)

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

    return Cypress.action('runner:test:end', wrap(test))
  })

  _runner.on('pass', (test) => {
    return Cypress.action('runner:pass', wrap(test))
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
      return fire(TEST_AFTER_RUN_EVENT, test, Cypress)
    }
  })

  return _runner.on('fail', (runnable, err) => {
    let hookName
    const isHook = runnable.type === 'hook'

    $errUtils.normalizeErrorStack(err)

    if (isHook) {
      const parentTitle = runnable.parent.title

      hookName = getHookName(runnable)

      // append a friendly message to the error indicating
      // we're skipping the remaining tests in this suite
      err = $errUtils.appendErrMsg(
        err,
        $errUtils.errMsgByPath('uncaught.error_in_hook', {
          parentTitle,
          hookName,
        }),
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
      return hookFailed(runnable, runnable.err, hookName, getTestById, getTest)
    }
  })
}

const create = function (specWindow, mocha, Cypress, cy) {
  let _id = 0
  let _hookId = 0
  let _uncaughtFn = null

  const _runner = mocha.getRunner()

  _runner.suite = mocha.getRootSuite()

  specWindow.onerror = function () {
    let err = cy.onSpecWindowUncaughtException.apply(cy, arguments)

    // err will not be returned if cy can associate this
    // uncaught exception to an existing runnable
    if (!err) {
      return true
    }

    const todoMsg = function () {
      if (!Cypress.config('isTextTerminal')) {
        return 'Check your console for the stack trace or click this message to see where it originated from.'
      }
    }

    const append = () => {
      return _.chain([
        'Cypress could not associate this error to any specific test.',
        'We dynamically generated a new test to display this failure.',
        todoMsg(),
      ])
      .compact()
      .join('\n\n')
      .value()
    }

    // else  do the same thing as mocha here
    err = $errUtils.appendErrMsg(err, append())

    // remove this error's stack since it gives no valuable context
    err.stack = ''

    const throwErr = function () {
      throw err
    }

    // we could not associate this error
    // and shouldn't ever start our run
    _uncaughtFn = throwErr

    // return undefined so the browser does its default
    // uncaught exception behavior (logging to console)
    return undefined
  }

  // hold onto the _runnables for faster lookup later
  let _stopped = false
  let _test = null
  let _tests = []
  let _testsById = {}
  const _testsQueue = []
  const _testsQueueById = {}
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

  const getTestById = function (id) {
    // perf short circuit
    if (!id) {
      return
    }

    return _testsById[id]
  }

  overrideRunnerHook(Cypress, _runner, getTestById, getTest, setTest, getTests)

  return {
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
      )
    },

    run (fn) {
      if (_startTime == null) {
        _startTime = moment().toJSON()
      }

      _runnerListeners(_runner, Cypress, _emissions, getTestById, getTest, setTest, getHookId)

      return _runner.run((failures) => {
        // if we happen to make it all the way through
        // the run, then just set _stopped to true here
        _stopped = true

        // TODO this functions is not correctly
        // synchronized with the 'end' event that
        // we manage because of uncaught hook errors
        if (fn) {
          return fn(failures, getTestResults(_tests))
        }
      })
    },

    onRunnableRun (runnableRun, runnable, args) {
      let lifecycleStart; let test

      if (!runnable.id) {
        if (!_stopped) {
          throw new Error('runnable must have an id', runnable.id)
        }

        return
      }

      switch (runnable.type) {
        case 'hook':
          test = getTest() || getTestFromHook(runnable, runnable.parent, getTestById)
          break

        case 'test':
          test = runnable
          break

        default:
          break
      }

      // closure for calculating the actual
      // runtime of a runnables fn exection duration
      // and also the run of the runnable:after:run:async event
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

      // if we haven't yet fired this event for this test
      // that means that we need to reset the previous state
      // of cy - since we now have a new 'test' and all of the
      // associated _runnables will share this state
      if (!fired(TEST_BEFORE_RUN_EVENT, test)) {
        fire(TEST_BEFORE_RUN_EVENT, test, Cypress)
      }

      // extract out the next(fn) which mocha uses to
      // move to the next runnable - this will be our async seam
      const _next = args[0]

      const next = function (err) {
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

        return _next(err)
      }

      const onNext = function (err) {
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
      cy.setRunnable(runnable, hookName)

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

        runnable.fn = function () {
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
      for (let test of _tests) {
        if (test.id === id) {
          break
        } else {
          test = wrapAll(test)

          _.each(RUNNABLE_LOGS, (type) => {
            let logs

            logs = test[type]

            if (logs) {
              test[type] = _.map(logs, $Log.toSerializedJSON)
            }
          })

          tests[test.id] = test
        }
      }

      return tests
    },

    stop () {
      if (_stopped) {
        return
      }

      _stopped = true

      // abort the run
      _runner.abort()

      // emit the final 'end' event
      // since our reporter depends on this event
      // and mocha may never fire this becuase our
      // runnable may never finish
      _runner.emit('end')

      // remove all the listeners
      // so no more events fire
      return _runner.removeAllListeners()
    },

    getDisplayPropsForLog: $Log.getDisplayProps,

    getConsolePropsForLogById (logId) {
      let attrs

      attrs = _logsById[logId]

      if (attrs) {
        return $Log.getConsoleProps(attrs)
      }
    },

    getSnapshotPropsForLogById (logId) {
      let attrs

      attrs = _logsById[logId]

      if (attrs) {
        return $Log.getSnapshotProps(attrs)
      }
    },

    getErrorByTestId (testId) {
      let test

      test = getTestById(testId)

      if (test) {
        return $errUtils.wrapErr(test.err)
      }
    },

    resumeAtTest (id, emissions = {}) {
      Cypress._RESUMED_AT_TEST = id

      _emissions = emissions

      for (let test of _tests) {
        if (test.id !== id) {
          test._ALREADY_RAN = true
          test.pending = true
        } else {
          // bail so we can stop now
          return
        }
      }
    },

    cleanupQueue (numTestsKeptInMemory) {
      const cleanup = function (queue) {
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
      let existing

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

      existing = _logsById[attrs.id]

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

module.exports = {
  overrideRunnerHook,

  normalize,

  normalizeAll,

  create,
}
