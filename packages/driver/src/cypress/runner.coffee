_ = require("lodash")
Backbone = require("backbone")
moment = require("moment")
Promise = require("bluebird")

$Log = require("./log")
utils = require("./utils")

defaultGrep     = /.*/
mochaCtxKeysRe  = /^(_runnable|test)$/
betweenQuotesRe = /\"(.+?)\"/

ERROR_PROPS      = "message type name stack fileName lineNumber columnNumber host uncaught actual expected showDiff".split(" ")
RUNNABLE_LOGS    = "routes agents commands".split(" ")
RUNNABLE_PROPS   = "id title root hookName err duration state failedFromHook body".split(" ")

triggerMocha = (Cypress, event, args...) ->
  ## dont trigger mocha events if we are not headless
  return if not Cypress.isHeadless

  Cypress.trigger("mocha", event, args...)

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

waitForHooksToResolve = (ctx, event, test = {}) ->
  ## get an array of event listeners
  events = fire.call(ctx, event, test, {multiple: true})

  events = _.filter events, (r) ->
    ## get us out only promises
    ## due to a bug in bluebird with
    ## not being able to call {}.hasOwnProperty
    ## https://github.com/petkaantonov/bluebird/issues/1104
    ## TODO: think about applying this to the other areas
    ## that use Cypress.invoke(...)
    utils.isInstanceOf(r, Promise)

  Promise.all(events)
  .catch (err) ->
    ## this doesn't take into account events running prior to the
    ## test - but this is the best we can do considering we don't
    ## yet have test.callback (from mocha). so we just override
    ## its fn to automatically throw. however this really shouldn't
    ## ever even happen since the webapp prevents you from running
    ## tests to begin with. but its here just in case.
    test.fn = ->
      throw err

fire = (event, test, options = {}) ->
  test._fired ?= {}
  test._fired[event] = true

  ## dont fire anything again if we are skipped
  return if test._ALREADY_RAN

  if options.multiple
    [].concat(@Cypress.invoke(event, @wrap(test), test))
  else
    @Cypress.trigger(event, @wrap(test))

fired = (event, test) ->
  !!(test._fired and test._fired[event])

testEvents = {
  beforeRun: (ctx, test) ->
    if not fired("test:before:run", test)
      fire.call(ctx, "test:before:run", test)

  beforeHooksAsync: (ctx, test) ->
    ## there is a bug (but i believe its only in tests
    ## which happens in Ended Early Integration Tests
    ## where the test will be undefined due to the runner.suite
    ## not yet having built its tests/suites array and thus
    ## our @tests array is empty
    Promise.try ->
      if not fired("test:before:hooks", test)
        waitForHooksToResolve(ctx, "test:before:hooks", test)

  afterHooksAsync: (ctx, test) ->
    Promise.try ->
      if not fired("test:after:hooks", test)
        waitForHooksToResolve(ctx, "test:after:hooks", test)

  afterRun: (ctx, test) ->
    if not fired("test:after:run", test)
      fire.call(ctx, "test:after:run", test)

      _.each test.ctx, (value, key) ->
        if _.isObject(value) and not mochaCtxKeysRe.test(key)
          ## nuke any object properties that come from
          ## cy.as() aliases aggressively now, even though
          ## later on 'suite end' it will also clear ctx
          test.ctx[key] = null
}

class $Runner
  constructor: (@Cypress, @runner) ->
    @id = 0

    ## hold onto the runnables for faster lookup later
    @tests = []
    @testsById = {}
    @testsQueue = []
    @testsQueueById = {}
    @runnables = []
    @logsById = {}
    @emissions = {
      started: {}
      ended:   {}
    }
    @startTime = null

    @listeners()
    @override()

    ## this is used in tests since we provide
    ## the tests immediately
    @normalizeAll() if @runner.suite

  fail: (err, runnable) ->
    ## if runnable.state is passed then we've
    ## probably failed in an afterEach and need
    ## to update the runnable to failed status
    if runnable.state is "passed"
      @afterEachFailed(runnable, err)

    runnable.callback(err)

  listeners: ->
    ## bail if we've already set our listeners
    return if @setListeners

    @setListeners = true

    @listenTo @Cypress, "fail", (err, runnable) =>
      @fail(err, runnable)

    @listenTo @Cypress, "abort", => @abort()

    @listenTo @Cypress, "stop", => @stop()

    @listenTo @Cypress, "log", (attrs) =>
      @addLog(attrs)

    @listenTo @Cypress, "log:state:changed", (attrs) =>
      @addLog(attrs)

    @listenTo @Cypress, "test:after:run", (test) =>
      numTestsKeptInMemory = @Cypress.config("numTestsKeptInMemory")

      @cleanupQueue(@testsQueue, numTestsKeptInMemory)

    return @

  runnerListeners: ->
    ## bail if we've already set our runner listeners
    return if @setRunnerListeners

    @setRunnerListeners = true

    Cypress = @Cypress
    _this   = @

    ## mocha has begun running the tests
    @runner.on "start", ->
      Cypress.trigger "run:start"

      return if Cypress._RESUMED_AT_TEST

      triggerMocha(Cypress, "start")

    ## mocha has finished running the tests
    @runner.on "end", =>
      ## end may have been caused by an uncaught error
      ## that happened inside of a hook.
      ##
      ## when this happens mocha aborts the entire run
      ## and does not do the usual cleanup so that means
      ## we have to fire the test:after:hooks and
      ## test:after:run events ourselves
      end = =>
        Cypress.trigger "run:end"
        triggerMocha(Cypress, "end")

        @restore()

      ## if we have a test and err
      test = _this.test
      err  = test and test.err

      ## and this err is uncaught
      if err and err.uncaught

        ## fire all the events
        testEvents.afterHooksAsync(_this, test)
        .then ->
          testEvents.afterRun(_this, test)

          end()
      else
        end()

    @runner.on "suite", (suite) =>
      return if @emissions.started[suite.id]

      @emissions.started[suite.id] = true

      triggerMocha(Cypress, "suite", @wrap(suite))

    @runner.on "suite end", (suite) =>
      _.each suite.ctx, (value, key) ->
        delete suite.ctx[key]

      return if @emissions.ended[suite.id]

      @emissions.ended[suite.id] = true

      triggerMocha(Cypress, "suite end", @wrap(suite))

    @runner.on "hook", (hook) =>
      hookName = @getHookName(hook)

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
      test = @getTestFromHook(hook, hook.parent)
      hook.id = test.id
      hook.ctx.currentTest = test

      Cypress.set(hook, hookName)
      triggerMocha(Cypress, "hook", @wrap(hook))

    @runner.on "hook end", (hook) =>
      hookName = @getHookName(hook)

      ## because mocha fires a 'test' event first and then
      ## subsequently fires a beforeEach immediately after
      ## we have to re-set our test runnable after the
      ## beforeEach hook ends! every other hook is fine
      ## we do not need to re-set for any other type!
      if hookName is "before each" and test = hook.ctx.currentTest
        Cypress.set(test, "test")

      triggerMocha(Cypress, "hook end", @wrap(hook))

    @runner.on "test", (test) =>
      @test = test

      Cypress.set(test, "test")

      return if @emissions.started[test.id]

      @emissions.started[test.id] = true

      triggerMocha(Cypress, "test", @wrap(test))

    @runner.on "test end", (test) =>
      return if @emissions.ended[test.id]

      @emissions.ended[test.id] = true

      Cypress.checkForEndedEarly()

      triggerMocha(Cypress, "test end", @wrap(test))

    @runner.on "pass", (test) =>
      triggerMocha(Cypress, "pass", @wrap(test))

    ## if a test is pending mocha will only
    ## emit the pending event instead of the test
    ## so we normalize the pending / test events
    @runner.on "pending", (test) ->
      ## do nothing if our test is skipped
      return if test._ALREADY_RAN

      if not fired("test:before:run", test)
        fire.call(_this, "test:before:run", test)

      test.state = "pending"

      if not test.alreadyEmittedMocha
        ## do not double emit this event
        test.alreadyEmittedMocha = true
        triggerMocha(Cypress, "pending", _this.wrap(test))

      @emit "test", test

      ## if this is not the last test amongst its siblings
      ## then go ahead and fire its test:after:run event
      ## else this will not get called
      tests = _this.getAllSiblingTests(test.parent)
      if _.last(tests) isnt test
        fire.call(_this, "test:after:run", test)

    @runner.on "fail", (runnable, err) =>
      isHook = runnable.type is "hook"

      if isHook
        parentTitle = runnable.parent.title
        hookName    = @getHookName(runnable)

        ## append a friendly message to the error indicating
        ## we're skipping the remaining tests in this suite
        err.message += "\n\n" + utils.errMessageByPath("uncaught.error_in_hook", {parentTitle, hookName})

      ## always set runnable err so we can tap into
      ## taking a screenshot on error
      runnable.err = @wrapErr(err)

      if not runnable.alreadyEmittedMocha
        ## do not double emit this event
        runnable.alreadyEmittedMocha = true
        triggerMocha(Cypress, "fail", @wrap(runnable), runnable.err)

      if isHook
        @hookFailed(runnable, runnable.err, hookName)

  cleanupQueue: (queue, numTestsKeptInMemory) ->
    if queue.length > numTestsKeptInMemory
      test = queue.shift()

      delete @testsQueueById[test.id]

      _.each RUNNABLE_LOGS, (logs) ->
        _.each test[logs], (attrs) ->
          ## we know our attrs have been cleaned
          ## now, so lets store that
          attrs._hasBeenCleanedUp = true

          $Log.reduceMemory(attrs)

      @cleanupQueue(queue, numTestsKeptInMemory)

  getDisplayPropsForLog: (attrs) ->
    $Log.getDisplayProps(attrs)

  getConsolePropsForLogById: (logId) ->
    if attrs = @logsById[logId]
      $Log.getConsoleProps(attrs)

  getSnapshotPropsForLogById: (logId) ->
    if attrs = @logsById[logId]
      $Log.getSnapshotProps(attrs)

  getErrorByTestId: (testId) ->
    if test = @testsById[testId]
      @wrapErr(test.err)

  addLog: (attrs) ->
    ## we dont need to hold a log reference
    ## to anything in memory when we're headless
    ## because you cannot inspect any logs
    return if Cypress.isHeadless

    test = @testsById[attrs.testId]

    ## bail if for whatever reason we
    ## cannot associate this log to a test
    return if not test

    ## if this test isnt in the current queue
    ## then go ahead and add it
    if not @testsQueueById[test.id]
      @testsQueueById[test.id] = true
      @testsQueue.push(test)

    if existing = @logsById[attrs.id]
      ## because log:state:changed may
      ## fire at a later time, its possible
      ## we've already cleaned up these attrs
      ## and in that case we don't want to do
      ## anything at all
      return if existing._hasBeenCleanedUp

      ## mutate the existing object
      _.extend(existing, attrs)
    else
      @logsById[attrs.id] = attrs

      {testId, instrument} = attrs

      if test = @testsById[testId]
        ## pluralize the instrument
        ## as a property on the runnable
        logs = test[instrument + "s"] ?= []

        ## else push it onto the logs
        logs.push(attrs)

  matchesGrep: (runnable, grep) ->
    ## we have optimized this iteration to the maximum.
    ## we memoize the existential matchesGrep property
    ## so we dont regex again needlessly when going
    ## through tests which have already been set earlier
    if (not runnable.matchesGrep?) or (not _.isEqual(runnable.grepRe, grep))
      runnable.grepRe      = grep
      runnable.matchesGrep = grep.test(runnable.fullTitle())

    runnable.matchesGrep

  getEmissions: ->
    @emissions

  getTestsState: ->
    id    = @test?.id
    tests = {}

    ## bail if we dont have a current test
    return {} if not id

    ## search through all of the tests
    ## until we find the current test
    ## and break then
    for test in @tests
      if test.id is id
        break
      else
        test = @wrapAll(test)

        _.each RUNNABLE_LOGS, (type) ->
          if logs = test[type]
            test[type] = _.map(logs, $Log.toSerializedJSON)

        tests[test.id] = test

    return tests

  getId: ->
    ## increment the id counter
    "r" + (@id += 1)

  normalizeAll: (initialTests = {}, grep) ->
    hasTests = false

    ## only loop until we find the first test
    @firstTest @runner.suite, (test) ->
      hasTests = true

    ## if we dont have any tests then bail
    return if not hasTests

    tests         = {}
    grep         ?= @grep()
    grepIsDefault = _.isEqual(grep, defaultGrep)

    obj = @normalize(@runner.suite, tests, initialTests, grep, grepIsDefault)

    @testsById = tests
    @tests   = _.values(tests)

    return obj

  resumeAtTest: (id, emissions = {}) ->
    @Cypress._RESUMED_AT_TEST = id

    @emissions = emissions

    for test in @tests
      if test.id isnt id
        test._ALREADY_RAN = true
        test.pending = true
      else
        ## bail so we can stop now
        return

  normalize: (runnable, tests, initialTests, grep, grepIsDefault) ->

    normalize = (runnable) =>
      runnable.id = @getId()

      ## tests have a type of 'test' whereas suites do not have a type property
      runnable.type ?= "suite"

      @runnables.push(runnable)

      ## if we have a runnable in the initial state
      ## then merge in existing properties into the runnable
      if i = initialTests[runnable.id]
        _.each RUNNABLE_LOGS, (type) =>
          _.each i[type], (l) =>
            @logsById[l.id] = l

        _.extend(runnable, i)

      ## reduce this runnable down to its props
      ## and collections
      return @wrapAll(runnable)

    push = (test) =>
      tests[test.id] ?= test

    obj = normalize(runnable)

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
            @normalize(runnable, tests, initialTests, grep, grepIsDefault)
    else
      ## iterate through all tests and only push them in
      ## if they match the current grep
      obj.tests = _.reduce runnable.tests ? [], (memo, test) =>
        ## only push in the test if it matches
        ## our grep
        if @matchesGrep(test, grep)
          memo.push(normalize(test))
          push(test)
        memo
      , []

      ## and go through the suites
      obj.suites = _.reduce runnable.suites ? [], (memo, suite) =>
        ## but only add them if a single nested test
        ## actually matches the grep
        any = @anyTestInSuite suite, (test) =>
          @matchesGrep(test, grep)

        if any
          memo.push(@normalize(suite, tests, initialTests, grep, grepIsDefault))

        memo
      , []

    return obj

  reduceProps: (obj, props) ->
    _.reduce props, (memo, prop) ->
      if _.has(obj, prop) or obj[prop]
        memo[prop] = obj[prop]
      memo
    , {}

  wrapAll: (runnable) ->
    _.extend(
      {}
      @reduceProps(runnable, RUNNABLE_PROPS)
      @reduceProps(runnable, RUNNABLE_LOGS)
    )

  wrapErr: (err) ->
    @reduceProps(err, ERROR_PROPS)

  wrap: (runnable) ->
    ## we need to optimize wrap by converting
    ## tests to an id-based object which prevents
    ## us from recursively iterating through every
    ## parent since we could just return the found test
    @reduceProps(runnable, RUNNABLE_PROPS)

  restore: ->
    _.each [@runnables, @runner], (obj) =>
      @removeAllListeners(obj)

  stop: ->
    @stopListening()

    @restore()

    ## remove the wrapped hook fn
    delete @runner.hook

    @runner = @tests = @Cypress.runner = null

    return @

  removeAllListeners: (obj) ->
    array = [].concat(obj)
    _.invokeMap array, "removeAllListeners"

  abort: ->
    ## we dont need to restore here
    ## because the end event will fire
    ## (which abort causes) and thus
    ## restore is naturally called
    @runner.abort()

    ## we need to emit the end event here
    ## during an abort else mocha will not
    ## slice out the uncaughtException handlers
    ## and we will leak memory
    @runner.emit("end")

  options: (options = {}) ->
    ## TODO
    ## need to handle
    ## ignoreLeaks, asyncOnly, globals

    if re = options.grep
      @grep(re)

  countByTestState: (tests, state) ->
    count = _.filter tests, (test, key) ->
      test.state is state

    count.length

  setNumLogs: (num) ->
    $Log.setCounter(num)

  setStartTime: (iso) ->
    @startTime = iso

  getStartTime: ->
    @startTime

  run: (fn) ->
    @startTime ?= moment().toJSON()

    @runnerListeners()

    @runner.run (failures) =>
      ## TODO this functions is not correctly
      ## synchronized with the 'end' event that
      ## we manage because of uncaught hook errors
      fn(failures, @getTestResults()) if fn

  getTestResults: ->
    _.map @tests, (test) ->
      obj = _.pick(test, "id", "duration", "state")
      obj.title = test.originalTitle
      ## TODO FIX THIS!
      if not obj.state
        obj.state = "skipped"
      obj

  getHookName: (hook) ->
    ## find the name of the hook by parsing its
    ## title and pulling out whats between the quotes
    name = hook.title.match(betweenQuotesRe)
    name and name[1]

  afterEachFailed: (test, err) ->
    test.state = "failed"
    test.err = @wrapErr(err)
    triggerMocha(@Cypress, "test end", @wrap(test))

  hookFailed: (hook, err, hookName) ->
    ## finds the test by returning the first test from
    ## the parent or looping through the suites until
    ## it finds the first test
    test = @getTestFromHook(hook, hook.parent)
    test.err = err
    test.state = "failed"
    test.duration = hook.duration
    test.hookName = hookName
    test.failedFromHook = true

    if hook.alreadyEmittedMocha
      test.alreadyEmittedMocha = true
    else
      triggerMocha(@Cypress, "test end", @wrap(test))

  total: ->
    @runner.suite.total()

  getTestByTitle: (title) ->
    @firstTest @runner.suite, (test) ->
      test.title is title

  firstTest: (suite, fn) ->
    for test in suite.tests
      return test if fn(test)

    for suite in suite.suites
      return test if test = @firstTest(suite, fn)

  ## optimized iteration which loops through
  ## all tests until we explicitly return true
  anyTestInSuite: (suite, fn) ->
    for test in suite.tests
      return true if fn(test) is true

    for suite in suite.suites
      return true if @anyTestInSuite(suite, fn) is true

    ## else return false
    return false

  grep: (re) ->
    if arguments.length
      @runner._grep = re
    else
      ## grab grep from the mocha runner
      ## or just set it to all in case
      ## there is a mocha regression
      @runner._grep ?= defaultGrep

  ignore: (runnable) ->
    ## for mocha we just need to set
    ## it to pending so mocha does not
    ## attempt to run this runnable
    runnable.pending = true

    ## what about suites here? test what happens
    ## if they dont have an id.  i don't believe
    ## you can set a suite to pending!
    ## i think if this is a suite we should just
    ## iterate through all of its nested tests
    ## and set them all to pending!

  getTestFromHook: (hook, suite) ->
    ## if theres already a currentTest use that
    return test if test = hook?.ctx.currentTest

    ## if we have a hook id then attempt
    ## to find the test by its id
    if hook?.id
      found = @firstTest suite, (test) =>
        hook.id is test.id

      return found if found

    ## returns us the very first test
    ## which is in our grepped tests array
    ## based on walking down the current suite
    ## iterating through each test until it matches
    found = @firstTest suite, (test) =>
      @testInTests(test)

    return found if found

    ## have one last final fallback where
    ## we just return true on the very first
    ## test (used in testing)
    @firstTest suite, (test) -> true

  testInTests: (test) ->
    ## do a faster constant time lookup
    @testsById[test.id]

  getAllSiblingTests: (suite) ->
    tests = []
    suite.eachTest (test) =>
      ## iterate through each of our suites tests.
      ## this will iterate through all nested tests
      ## as well.  and then we add it only if its
      ## in our grepp'd _this.tests array
      if @testInTests(test)
        tests.push test

    tests

  override: ->
    ## bail if our runner doesnt have a hook
    ## useful in tests
    return if not @runner.hook

    Cypress = @Cypress

    ## monkey patch the hook event so we can wrap
    ## 'test:before:hooks' and 'test:after:hooks' around all of
    ## the hooks surrounding a test runnable
    _this = @

    @runner.hook = _.wrap @runner.hook, (orig, name, fn) ->
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
        if not _this.test
          _this.test = _this.getTestFromHook(hook, suite)

        testEvents.beforeRun(_this, _this.test)

        fn = _.wrap fn, (orig, args...) ->
          testEvents.beforeHooksAsync(_this, _this.test)
          .then ->
            orig(args...)

      testAfterHooks = ->
        test = _this.test

        _this.test = null

        fn = _.wrap fn, (orig, args...) ->
          testEvents.afterHooksAsync(_this, test)
          .then ->
            testEvents.afterRun(_this, test)

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
          tests = _this.getAllSiblingTests(_this.test.parent)

          ## make sure this test isnt the last test overall but also
          ## isnt the last test in our grep'd parent suite's tests array
          if @suite.root and (_this.test isnt _.last(_this.tests)) and (_this.test isnt _.last(tests))
            testAfterHooks()

        when "afterAll"
          ## find all of the grep'd _this tests which share
          ## the same parent suite as our current _this test
          if _this.test
            tests = _this.getAllSiblingTests(_this.test.parent)

            ## if we're the very last test in the entire _this.tests
            ## we wait until the root suite fires
            ## else we wait until the very last possible moment by waiting
            ## until the root suite is the parent of the current suite
            ## since that will bubble up IF we're the last nested suite
            ## else if we arent the last nested suite we fire if we're
            ## the last test
            if (@suite.root and _this.test is _.last(_this.tests)) or
              (@suite.parent?.root and _this.test is _.last(tests)) or
                (not isLastSuite(@suite) and _this.test is _.last(tests))
              testAfterHooks()

      orig.call(@, name, fn)

  _.extend $Runner.prototype, Backbone.Events

  @runner = (Cypress, runner) ->
    ## clear out existing listeners
    ## if we already exist!
    if existing = Cypress.runner
      existing.stopListening()

    Cypress.runner = new $Runner Cypress, runner

  @create = (Cypress, specWindow, mocha) ->
    runner = mocha.getRunner()
    runner.suite = specWindow.mocha.suite
    @runner(Cypress, runner)

module.exports = $Runner
