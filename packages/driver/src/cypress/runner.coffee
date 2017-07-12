_ = require("lodash")
Backbone = require("backbone")
moment = require("moment")
Promise = require("bluebird")

$Log = require("./log")
utils = require("./utils")

id = 0

defaultGrepRe   = /.*/
mochaCtxKeysRe  = /^(_runnable|test)$/
betweenQuotesRe = /\"(.+?)\"/

ERROR_PROPS      = "message type name stack fileName lineNumber columnNumber host uncaught actual expected showDiff".split(" ")
RUNNABLE_LOGS    = "routes agents commands".split(" ")
RUNNABLE_PROPS   = "id title root hookName err duration state failedFromHook body".split(" ")

# ## initial payload
# {
#   suites: [
#     {id: "r1"}, {id: "r4", suiteId: "r1"}
#   ]
#   tests: [
#     {id: "r2", title: "foo", suiteId: "r1"}
#   ]
# }

# ## normalized
# {
#   {
#     root: true
#     suites: []
#     tests: []
#   }
# }

# ## resetting state (get back from server)
# {
#   scrollTop: 100
#   tests: {
#     r2: {id: "r2", title: "foo", suiteId: "r1", state: "passed", err: "", routes: [
#         {}, {}
#       ]
#       agents: [
#       ]
#       commands: [
#         {}, {}, {}
#       ]
#     }}
#
#     r3: {id: "r3", title: "bar", suiteId: "r1", state: "failed", logs: {
#       routes: [
#         {}, {}
#       ]
#       spies: [
#       ]
#       commands: [
#         {}, {}, {}
#       ]
#     }}
#   ]
# }

waitForHooksToResolve = (ee, event, test = {}) ->
  ## get an array of event listeners
  # events = fire.call(ctx, event, test, {multiple: true})
  #
  # events = _.filter events, (r) ->
  #   ## get us out only promises
  #   ## due to a bug in bluebird with
  #   ## not being able to call {}.hasOwnProperty
  #   ## https://github.com/petkaantonov/bluebird/issues/1104
  #   ## TODO: think about applying this to the other areas
  #   ## that use Cypress.invoke(...)
  #   utils.isInstanceOf(r, Promise)

  # Promise.all(events)
  ee.emitThen(event, test)
  .catch (err) ->
    ## this doesn't take into account events running prior to the
    ## test - but this is the best we can do considering we don't
    ## yet have test.callback (from mocha). so we just override
    ## its fn to automatically throw. however this really shouldn't
    ## ever even happen since the webapp prevents you from running
    ## tests to begin with. but its here just in case.
    test.fn = ->
      throw err

fire = (ee, event, test, options = {}) ->
  test._fired ?= {}
  test._fired[event] = true

  ## dont fire anything again if we are skipped
  return if test._ALREADY_RAN

  if options.multiple
    throw new Error("options.multiple is true")
    # [].concat(@Cypress.invoke(event, wrap(test), test))
  else
    ee.emit(event, wrap(test))
    # @Cypress.trigger(event, wrap(test))

fired = (event, test) ->
  !!(test._fired and test._fired[event])

testEvents = {
  beforeRun: (ee, test) ->
    if not fired("test:before:run", test)
      fire(ee, "test:before:run", test)

  beforeHooksAsync: (ee, test) ->
    ## there is a bug (but i believe its only in tests
    ## which happens in Ended Early Integration Tests
    ## where the test will be undefined due to the runner.suite
    ## not yet having built its tests/suites array and thus
    ## our @tests array is empty
    Promise.try ->
      if not fired("test:before:hooks", test)
        waitForHooksToResolve(ee, "test:before:hooks", test)

  afterHooksAsync: (ee, test) ->
    Promise.try ->
      if not fired("test:after:hooks", test)
        waitForHooksToResolve(ee, "test:after:hooks", test)

  afterRun: (ee, test) ->
    if not fired("test:after:run", test)
      fire(ee, "test:after:run", test)

      _.each test.ctx, (value, key) ->
        if _.isObject(value) and not mochaCtxKeysRe.test(key)
          ## nuke any object properties that come from
          ## cy.as() aliases aggressively now, even though
          ## later on 'suite end' it will also clear ctx
          test.ctx[key] = null
}

reduceProps = (obj, props) ->
  _.reduce props, (memo, prop) ->
    if _.has(obj, prop) or obj[prop]
      memo[prop] = obj[prop]
    memo
  , {}

wrap = (runnable) ->
  ## we need to optimize wrap by converting
  ## tests to an id-based object which prevents
  ## us from recursively iterating through every
  ## parent since we could just return the found test
  reduceProps(runnable, RUNNABLE_PROPS)

wrapAll = (runnable) ->
  _.extend(
    {},
    reduceProps(runnable, RUNNABLE_PROPS),
    reduceProps(runnable, RUNNABLE_LOGS)
  )

wrapErr = (err) ->
  reduceProps(err, ERROR_PROPS)

getHookName = (hook) ->
  ## find the name of the hook by parsing its
  ## title and pulling out whats between the quotes
  name = hook.title.match(betweenQuotesRe)
  name and name[1]

anyTestInSuite = (suite, fn) ->
  for test in suite.tests
    return true if fn(test) is true

  for suite in suite.suites
    return true if anyTestInSuite(suite, fn) is true

  ## else return false
  return false

onFirstTest = (suite, fn) ->
  for test in suite.tests
    return test if fn(test)

  for suite in suite.suites
    return test if test = onFirstTest(suite, fn)

testInTestsById = (testsById, test) ->
  ## do a faster constant time lookup
  testsById[test.id]

getAllSiblingTests = (suite, testsById) ->
  tests = []
  suite.eachTest (test) =>
    ## iterate through each of our suites tests.
    ## this will iterate through all nested tests
    ## as well.  and then we add it only if its
    ## in our grepp'd _this.tests array
    if testInTestsById(testsById, test)
      tests.push test

  tests

getTestFromHook = (hook, suite, testsById) ->
  ## if theres already a currentTest use that
  return test if test = hook?.ctx.currentTest

  ## if we have a hook id then attempt
  ## to find the test by its id
  if hook?.id
    found = onFirstTest suite, (test) =>
      hook.id is test.id

    return found if found

  ## returns us the very first test
  ## which is in our grepped tests array
  ## based on walking down the current suite
  ## iterating through each test until it matches
  found = onFirstTest suite, (test) =>
    testInTestsById(testsById, test)

  return found if found

  ## have one last final fallback where
  ## we just return true on the very first
  ## test (used in testing)
  onFirstTest suite, (test) -> true

overrideRunnerHook = (ee, runner, testsById, getTest, setTest, getTests) ->
  ## bail if our runner doesnt have a hook.
  ## useful in tests
  return if not runner.hook

  ## monkey patch the hook event so we can wrap
  ## 'test:before:hooks' and 'test:after:hooks' around all of
  ## the hooks surrounding a test runnable
  _this = @

  runner.hook = _.wrap runner.hook, (orig, name, fn) ->
    hooks = @suite["_" + name]

    ## we have to see if this is the last suite amongst
    ## its siblings.  but first we have to filter out
    ## suites which dont have a grep'd test in them
    isLastSuite = (suite) ->
      return false if suite.root

      ## grab all of the suites from our grep'd tests
      ## including all of their ancestor suites!
      suites = _.reduce _this.tests, (memo, test) ->
        while parent = test.parent
          memo.push(parent)
          test = parent
        memo
      , []

      ## intersect them with our parent suites and see if the last one is us
      _
      .chain(suites)
      .uniq()
      .intersection(suite.parent.suites)
      .last()
      .value() is suite

    testBeforeHooks = (hook, suite) ->
      if not getTest()
        t = getTestFromHook(hook, suite, testsById)
        setTest(t)

      testEvents.beforeRun(ee, getTest())

      fn = _.wrap fn, (orig, args...) ->
        testEvents.beforeHooksAsync(ee, getTest())
        .then ->
          orig(args...)

    testAfterHooks = ->
      test = getTest()

      setTest(null)

      fn = _.wrap fn, (orig, args...) ->
        testEvents.afterHooksAsync(ee, test)
        .then ->
          testEvents.afterRun(ee, test)

          Cypress.restore()

          orig(args...)

    switch name
      when "beforeAll"
        testBeforeHooks(hooks[0], @suite)

      when "beforeEach"
        if @suite.root
          testBeforeHooks(hooks[0], @suite)

      when "afterEach"
        ## find all of the grep'd _this tests which share
        ## the same parent suite as our current _this test
        tests = getAllSiblingTests(getTest().parent, testsById)

        ## make sure this test isnt the last test overall but also
        ## isnt the last test in our grep'd parent suite's tests array
        if @suite.root and (getTest() isnt _.last(getTests())) and (getTest() isnt _.last(tests))
          testAfterHooks()

      when "afterAll"
        ## find all of the grep'd _this tests which share
        ## the same parent suite as our current _this test
        if getTest()
          tests = getAllSiblingTests(getTest().parent, testsById)

          ## if we're the very last test in the entire _this.tests
          ## we wait until the root suite fires
          ## else we wait until the very last possible moment by waiting
          ## until the root suite is the parent of the current suite
          ## since that will bubble up IF we're the last nested suite
          ## else if we arent the last nested suite we fire if we're
          ## the last test
          if (@suite.root and getTest() is _.last(getTests())) or
            (@suite.parent?.root and getTest() is _.last(tests)) or
              (not isLastSuite(@suite) and getTest() is _.last(tests))
            testAfterHooks()

    orig.call(@, name, fn)

getId = ->
  ## increment the id counter
  "r" + (id += 1)

matchesGrep = (runnable, grep) ->
  ## we have optimized this iteration to the maximum.
  ## we memoize the existential matchesGrep property
  ## so we dont regex again needlessly when going
  ## through tests which have already been set earlier
  if (not runnable.matchesGrep?) or (not _.isEqual(runnable.grepRe, grep))
    runnable.grepRe      = grep
    runnable.matchesGrep = grep.test(runnable.fullTitle())

  runnable.matchesGrep

getTestResults = (tests) ->
  _.map tests, (test) ->
    obj = _.pick(test, "id", "duration", "state")
    obj.title = test.originalTitle
    ## TODO FIX THIS!
    if not obj.state
      obj.state = "skipped"
    obj

normalizeAll = (suite, initialTests = {}, grep, onTestsById, onTests, onRunnable, onLogsById) ->
  hasTests = false

  ## only loop until we find the first test
  onFirstTest suite, (test) ->
    hasTests = true

  ## if we dont have any tests then bail
  return if not hasTests

  ## we are doing a super perf loop here where
  ## we hand back a normalized object but also
  ## create optimized lookups for the tests without
  ## traversing through it multiple times
  tests         = {}
  grepIsDefault = _.isEqual(grep, defaultGrepRe)

  obj = normalize(suite, tests, initialTests, grep, grepIsDefault, onRunnable, onLogsById)

  if onTestsById
    ## use callback here to hand back
    ## the optimized tests
    onTestsById(tests)

  if onTests
    ## same pattern here
    onTests(_.values(tests))

  return obj

normalize = (runnable, tests, initialTests, grep, grepIsDefault, onRunnable, onLogsById) ->
  normalizer = (runnable) =>
    runnable.id = getId()

    ## tests have a type of 'test' whereas suites do not have a type property
    runnable.type ?= "suite"

    if onRunnable
      onRunnable(runnable)

    ## if we have a runnable in the initial state
    ## then merge in existing properties into the runnable
    if i = initialTests[runnable.id]
      _.each RUNNABLE_LOGS, (type) =>
        _.each i[type], onLogsById

      _.extend(runnable, i)

    ## reduce this runnable down to its props
    ## and collections
    return wrapAll(runnable)

  push = (test) =>
    tests[test.id] ?= test

  obj = normalizer(runnable)

  ## if we have a default grep then avoid
  ## grepping altogether and just push
  ## tests into the array of tests
  if grepIsDefault
    if runnable.type is "test"
      push(runnable)

    ## and recursively iterate and normalize all other runnables
    _.each {tests: runnable.tests, suites: runnable.suites}, (runnables, key) =>
      if runnable[key]
        obj[key] = _.map runnables, (runnable) =>
          normalize(runnable, tests, initialTests, grep, grepIsDefault, onRunnable, onLogsById)
  else
    ## iterate through all tests and only push them in
    ## if they match the current grep
    obj.tests = _.reduce runnable.tests ? [], (memo, test) =>
      ## only push in the test if it matches
      ## our grep
      if matchesGrep(test, grep)
        memo.push(normalizer(test))
        push(test)
      memo
    , []

    ## and go through the suites
    obj.suites = _.reduce runnable.suites ? [], (memo, suite) =>
      ## but only add them if a single nested test
      ## actually matches the grep
      any = anyTestInSuite suite, (test) =>
        matchesGrep(test, grep)

      if any
        memo.push(
          normalize(
            suite,
            tests,
            initialTests,
            grep,
            grepIsDefault,
            onRunnable
          )
        )

      memo
    , []

  return obj

hookFailed = (hook, err, hookName, testsById) ->
  ## finds the test by returning the first test from
  ## the parent or looping through the suites until
  ## it finds the first test
  test = getTestFromHook(hook, hook.parent, testsById)
  test.err = err
  test.state = "failed"
  test.duration = hook.duration
  test.hookName = hookName
  test.failedFromHook = true

  if hook.alreadyEmittedMocha
    ## TODO: won't this always hit right here???
    ## when would the hook not be emitted at this point?
    test.alreadyEmittedMocha = true
  else
    Cypress.action("runner:test:end", wrap(test))

runnerListeners = (runner, Cypress, emissions, testsById, setTest) ->
  runner.on "start", ->
    Cypress.action("runner:start")

  runner.on "end", ->
    Cypress.action("runner:end")

  runner.on "suite", (suite) ->
    return if emissions.started[suite.id]

    emissions.started[suite.id] = true

    Cypress.action("runner:suite:start", wrap(suite))

  runner.on "suite end", (suite) ->
    ## perf loop
    for key, value of suite.ctx
      delete suite.ctx[key]

    return if emissions.ended[suite.id]

    emissions.ended[suite.id] = true

    Cypress.action("runner:suite:end", wrap(suite))

  runner.on "hook", (hook) ->
    hookName = getHookName(hook)

    ## mocha incorrectly sets currentTest on before all's.
    ## if there is a nested suite with a before, then
    ## currentTest will refer to the previous test run
    ## and not our current
    if hookName is "before all" and hook.ctx.currentTest
      delete hook.ctx.currentTest

    ## set the hook's id from the test because
    ## hooks do not have their own id, their
    ## commands need to grouped with the test
    ## and we can only associate them by this id
    test = getTestFromHook(hook, hook.parent, testsById)
    hook.id = test.id
    hook.ctx.currentTest = test

    Cypress.action("runner:set:runnable", hook, hookName)

    Cypress.action("runner:hook:start", wrap(hook))

  runner.on "hook end", (hook) ->
    hookName = getHookName(hook)

    ## because mocha fires a 'test' event first and then
    ## subsequently fires a beforeEach immediately after
    ## we have to re-set our test runnable after the
    ## beforeEach hook ends! every other hook is fine
    ## we do not need to re-set for any other type!
    if hookName is "before each" and test = hook.ctx.currentTest
      Cypress.action("runner:set:runnable", test, "test")

    Cypress.action("runner:hook:end", wrap(hook))

  runner.on "test", (test) ->
    setTest(test)

    Cypress.action("runner:set:runnable", test, "test")

    return if emissions.started[test.id]

    emissions.started[test.id] = true

    Cypress.action("runner:test:start", wrap(test))

  runner.on "test end", (test) ->
    return if emissions.ended[test.id]

    emissions.ended[test.id] = true

    Cypress.action("runner:test:end", wrap(test))

  runner.on "pass", (test) ->
    Cypress.action("runner:pass", wrap(test))

  ## if a test is pending mocha will only
  ## emit the pending event instead of the test
  ## so we normalize the pending / test events
  runner.on "pending", (test) ->
    ## do nothing if our test is skipped
    return if test._ALREADY_RAN

    if not fired("test:before:run", test)
      fire(Cypress, "test:before:run", test)

    test.state = "pending"

    if not test.alreadyEmittedMocha
      ## do not double emit this event
      test.alreadyEmittedMocha = true

      Cypress.action("runner:pending", wrap(test))

    @emit("test", test)

    ## if this is not the last test amongst its siblings
    ## then go ahead and fire its test:after:run event
    ## else this will not get called
    tests = getAllSiblingTests(test.parent, testsById)

    if _.last(tests) isnt test
      fire(Cypress, "test:after:run", test)

  runner.on "fail", (runnable, err) ->
    isHook = runnable.type is "hook"

    if isHook
      parentTitle = runnable.parent.title
      hookName    = getHookName(runnable)

      ## append a friendly message to the error indicating
      ## we're skipping the remaining tests in this suite
      err.message += "\n\n" + utils.errMessageByPath("uncaught.error_in_hook", {parentTitle, hookName})

    ## always set runnable err so we can tap into
    ## taking a screenshot on error
    runnable.err = wrapErr(err)

    if not runnable.alreadyEmittedMocha
      ## do not double emit this event
      runnable.alreadyEmittedMocha = true

      Cypress.action("runner:fail", wrap(runnable), runnable.err)

    if isHook
      ## TODO: why do we need to do this???
      hookFailed(runnable, runnable.err, hookName, testsById)

create = (mocha, Cypress) ->
  id = 0

  runner = mocha.getRunner()
  runner.suite = mocha.getRootSuite()

  ## this is used in tests since we provide
  ## the tests immediately
  # normalizeAll(runner.suite, {}, grep()) if runner.suite

  ## hold onto the runnables for faster lookup later
  test = null
  tests = []
  testsById = {}
  testsQueue = []
  testsQueueById = {}
  runnables = []
  logsById = {}
  emissions = {
    started: {}
    ended:   {}
  }
  startTime = null

  # @listeners()

  onTestsById = (tbid) ->
    testsById = tbid

  onTests = (t) ->
    tests = t

  onRunnable = (r) ->
    runnables.push(r)

  onLogsById = (l) ->
    logsById[l.id] = l

  getTest = ->
    test

  setTest = (t) ->
    test = t

  getTests = ->
    tests

  addLog: (attrs, isHeadless) ->
    ## we dont need to hold a log reference
    ## to anything in memory when we're headless
    ## because you cannot inspect any logs
    return if isHeadless

    test = testsById[attrs.testId]

    ## bail if for whatever reason we
    ## cannot associate this log to a test
    return if not test

    ## if this test isnt in the current queue
    ## then go ahead and add it
    if not testsQueueById[test.id]
      testsQueueById[test.id] = true
      testsQueue.push(test)

    if existing = logsById[attrs.id]
      ## because log:state:changed may
      ## fire at a later time, its possible
      ## we've already cleaned up these attrs
      ## and in that case we don't want to do
      ## anything at all
      return if existing._hasBeenCleanedUp

      ## mutate the existing object
      _.extend(existing, attrs)
    else
      logsById[attrs.id] = attrs

      { testId, instrument } = attrs

      if test = testsById[testId]
        ## pluralize the instrument
        ## as a property on the runnable
        logs = test[instrument + "s"] ?= []

        ## else push it onto the logs
        logs.push(attrs)

  overrideRunnerHook(Cypress, runner, testsById, getTest, setTest, getTests)

  return {
    id

    grep: (re) ->
      if arguments.length
        runner._grep = re
      else
        ## grab grep from the mocha runner
        ## or just set it to all in case
        ## there is a mocha regression
        runner._grep ?= defaultGrepRe

    options: (options = {}) ->
      ## TODO
      ## need to handle
      ## ignoreLeaks, asyncOnly, globals

      if re = options.grep
        @grep(re)

    normalizeAll: (tests) ->
      normalizeAll(
        runner.suite,
        tests,
        @grep(),
        onTestsById,
        onTests,
        onRunnable,
        onLogsById
      )

    run: (fn) ->
      startTime ?= moment().toJSON()

      runnerListeners(runner, Cypress, emissions, testsById, setTest)

      runner.run (failures) =>
        ## TODO this functions is not correctly
        ## synchronized with the 'end' event that
        ## we manage because of uncaught hook errors
        fn(failures, getTestResults(tests)) if fn

    getStartTime: ->
      startTime

    setStartTime: (iso) ->
      startTime = iso

    getErrorByTestId: (testId) ->
      if test = testsById[testId]
        wrapErr(test.err)

    getDisplayPropsForLog: $Log.getDisplayProps

    getConsolePropsForLogById: (logId) ->
      if attrs = logsById[logId]
        $Log.getConsoleProps(attrs)

    getSnapshotPropsForLogById: (logId) ->
      if attrs = logsById[logId]
        $Log.getSnapshotProps(attrs)

    getErrorByTestId: (testId) ->
      if test = testsById[testId]
        wrapErr(test.err)

    cleanupQueue: (numTestsKeptInMemory) ->
      cleanup = (queue) ->
        if queue.length > numTestsKeptInMemory
          test = queue.shift()

          delete testsQueueById[test.id]

          _.each RUNNABLE_LOGS, (logs) ->
            _.each test[logs], (attrs) ->
              ## we know our attrs have been cleaned
              ## now, so lets store that
              attrs._hasBeenCleanedUp = true

              $Log.reduceMemory(attrs)

          cleanup(queue)

      cleanup(testsQueue)
  }

module.exports = {
  overrideRunnerHook

  normalize

  normalizeAll

  create
}
