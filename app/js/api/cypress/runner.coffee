$Cypress.Runner = do ($Cypress, _) ->

  class $Runner
    constructor: (@Cypress, @runner) ->
      @initialize()

      @listeners()
      @override()
      @getRunnables() if @runner.suite

    fail: (err, runnable) ->
      ## if runnable.state is passed then we've
      ## probably failed in an afterEach and need
      ## to update the runnable to failed status
      @afterEachFailed(runnable, err) if runnable.state is "passed"

      runnable.callback(err)

    initialize: ->
      ## hold onto the runnables for faster lookup later
      @runnables = []

    listeners: ->
      ## bail if we've already set our listeners
      return if @setListeners

      @setListeners = true

      @listenTo @Cypress, "fail", (err, runnable) =>
        @fail(err, runnable)

      @listenTo @Cypress, "abort", => @abort()

      @listenTo @Cypress, "stop", => @stop()

      return @

    runnerListeners: ->
      ## bail if we've already set our runner listeners
      return if @setRunnerListeners

      @setRunnerListeners = true

      Cypress = @Cypress

      ## mocha has begun running the tests
      @runner.on "start", ->
        Cypress.trigger "run:start"

      ## mocha has finished running the tests
      @runner.on "end", =>
        Cypress.trigger "run:end"

        @restore()

      @runner.on "suite", (suite) =>
        Cypress.trigger "suite:start", @wrap(suite)

      @runner.on "suite end", (suite) =>
        Cypress.trigger "suite:end", @wrap(suite)

        _.each suite.ctx, (value, key) ->
          delete suite.ctx[key]

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
        Cypress.trigger "hook:start", @wrap(hook)

      @runner.on "hook end", (hook) =>
        hookName = @getHookName(hook)

        ## because mocha fires a 'test' event first and then
        ## subsequently fires a beforeEach immediately after
        ## we have to re-set our test runnable after the
        ## beforeEach hook ends! every other hook is fine
        ## we do not need to re-set for any other type!
        if hookName is "before each" and test = hook.ctx.currentTest
          Cypress.set(test, "test")

        Cypress.trigger "hook:end", @wrap(hook)

      @runner.on "test", (test) =>
        @test = test

        Cypress.set(test, "test")
        Cypress.trigger "test:start", @wrap(test)

      @runner.on "test end", (test) =>
        Cypress.trigger "test:end", @wrap(test)

      ## if a test is pending mocha will only
      ## emit the pending event instead of the test
      ## so we normalize the pending / test events
      @runner.on "pending", (test) ->
        test.state = "pending"
        @emit "test", test

      @runner.on "fail", (runnable, err) =>
        runnable.err = err

        @hookFailed(runnable, err) if runnable.type is "hook"

    wrap: (runnable) ->
      ## we need to optimize wrap by converting
      ## tests to an id-based object which prevents
      ## us from recursively iterating through every
      ## parent since we could just return the found test
      r = _(runnable).pick "id", "title", "originalTitle", "root", "hookName", "err", "duration", "state", "failedFromHook"

      if parent = runnable.parent
        ## recursively walk up the parent chain
        r.parent = @wrap(parent)

      return r

    restore: ->
      _.each [@runnables, @runner], (obj) =>
        @removeAllListeners(obj)

      @initialize()

    stop: ->
      @stopListening()

      @restore()

      ## remove the wrapped hook fn
      delete @runner.hook

      @runner = @tests = @Cypress.runner = null

      return @

    removeAllListeners: (obj) ->
      array = [].concat(obj)
      _.invoke array, "removeAllListeners"

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

    run: (fn) ->
      @runnerListeners()

      @runner.run (err) =>
        fn(err, @getTestResults()) if fn

    getTestResults: ->
      _(@tests).map (test) ->
        obj = _(test).pick("id", "duration", "state")
        obj.title = test.originalTitle
        ## TODO FIX THIS!
        if not obj.state
          obj.state = "skipped"
        obj

    getHookName: (hook) ->
      ## find the name of the hook by parsing its
      ## title and pulling out whats between the quotes
      name = hook.title.match(/\"(.+)\"/)
      name and name[1]

    afterEachFailed: (test, err) ->
      test.state = "failed"
      test.err = err
      @Cypress.trigger "test:end", @wrap(test)

    hookFailed: (hook, err) ->
      ## finds the test by returning the first test from
      ## the parent or looping through the suites until
      ## it finds the first test
      test = @getTestFromHook(hook, hook.parent)
      test.err = err
      test.state = "failed"
      test.duration = hook.duration
      test.hookName = @getHookName(hook)
      test.failedFromHook = true
      @Cypress.trigger "test:end", @wrap(test)

    ## returns each runnable to the callback function
    ## if it matches the current grep
    ## subsequent runnable iterations are optimized
    getRunnables: (options = {}) ->
      ## reset our tests on each iteration
      ## use this to hold onto the tests
      ## that pass the current grep
      @tests = []

      ## when grep isnt /.*/, it means a user has written a .only
      ## on a suite or a test, and in that case we dont want to
      ## call onRunnable unless they match our grep.
      _.defaults options,
        grep: @grep()
        iterate: true
        pushRunnables: true
        onRunnable: ->

      ## if we already have runnables then just
      ## prefer these instead of the deep iteration
      ## this is simply faster performance
      if @runnables.length
        _.extend options,
          iterate: false
          pushRunnables: false

        for runnable in @runnables
          @process(runnable, options)

        return null

      else
        ## go through the normal iteration off of the root suite
        @iterateThroughRunnables(@runner.suite, options)

    ## iterates through both the runnables tests + suites if it has any
    iterateThroughRunnables: (runnable, options) ->
      _.each [runnable.tests, runnable.suites], (array) =>
        _.each array, (runnable) =>
          @process runnable, options

    ## generates an id for each runnable and then continues iterating
    ## on children tests + suites
    process: (runnable, options) ->
      ## iterating on both the test and its parent (the suite)
      ## bail if we're the root runnable
      ## or we've already processed this tests parent
      return if runnable.root

      ## tests have a runnable of 'test' whereas suites do not have a runnable property
      runnable.type ?= "suite"

      ## hold onto all of the runnables in a flat array
      ## so we can look this up much faster in the future
      @runnables.push(runnable) if options.pushRunnables

      ## we have optimized this iteration to the maximum.
      ## we memoize the existential matchesGrep property
      ## so we dont do N+1 ops
      ## also if we are testing against a NEW grep then
      ## nuke
      matchesGrep = (runnable, grep) ->
        ## we want to make sure this is the grep pattern we previously
        ## matched against
        if (not runnable.matchesGrep?) or (not _.isEqual(runnable.grepRe, grep))
          runnable.grepRe      = grep
          runnable.matchesGrep = grep.test(runnable.fullTitle())

        runnable.matchesGrep

      ## trigger the add events so our UI can begin displaying
      ## the tests + suites
      switch runnable.type
        when "suite"
          any = @anyTest runnable, (test) ->
            matchesGrep(test, options.grep)

          options.onRunnable(runnable) if any

        when "test"
          if matchesGrep(runnable, options.grep)
            options.onRunnable(runnable)
            @tests.push runnable

      ## recursively apply to all tests / suites of this runnable
      ## unless we've been told not to iterate (during optimized loop)
      @iterateThroughRunnables(runnable, options) if options.iterate

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
    anyTest: (suite, fn) ->
      for test in suite.tests
        return true if fn(test) is true

      for suite in suite.suites
        return true if @anyTest(suite, fn) is true

      ## else return false
      return false

    grep: (re) ->
      if arguments.length
        @runner._grep = re
      else
        ## grab grep from the mocha runner
        ## or just set it to all in case
        ## there is a mocha regression
        @runner._grep ?= /.*/

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
      @firstTest suite, (test) =>
        @testInTests(test)

    testInTests: (test) ->
      test in @tests

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

        getAllSiblingTests = (suite) ->
          tests = []
          suite.eachTest (test) ->
            ## iterate through each of our suites tests.
            ## this will iterate through all nested tests
            ## as well.  and then we add it only if its
            ## in our grepp'd _this.tests array
            if _this.testInTests(test)
              tests.push test

          tests

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
          _.chain(suites).uniq().intersection(suite.parent.suites).last().value() is suite

        testBeforeHooks = (hook, suite) ->
          _this.test = _this.getTestFromHook(hook, suite) if not _this.test

          ## there is a bug (but i believe its only in tests
          ## which happens in Ended Early Integration Tests
          ## where the test will be undefined due to the runner.suite
          ## not yet having built its tests/suites array and thus
          ## our @tests array is empty
          Cypress.trigger "test:before:hooks", _this.wrap(_this.test ? {})

        testAfterHooks = ->
          test = _this.test

          _this.test = null

          Cypress.trigger "test:after:hooks", _this.wrap(test)

          Cypress.restore()

        switch name
          when "beforeAll"
            ## if we're the root suite we know to fire
            if @suite.root
              testBeforeHooks(hooks[0], @suite)

          when "beforeEach"
            if @suite.root and _this.test isnt _this.tests[0]
              testBeforeHooks(hooks[0], @suite)

          when "afterEach"
            ## find all of the grep'd _this tests which share
            ## the same parent suite as our current _this test
            tests = getAllSiblingTests(_this.test.parent)

            ## make sure this test isnt the last test overall but also
            ## isnt the last test in our grep'd parent suite's tests array
            if @suite.root and (_this.test isnt _(_this.tests).last()) and (_this.test isnt _(tests).last())
              fn = _.wrap fn, (orig, args...) ->
                testAfterHooks().then ->
                  orig(args...)

          when "afterAll"
            ## find all of the grep'd _this tests which share
            ## the same parent suite as our current _this test
            if _this.test
              tests = getAllSiblingTests(_this.test.parent)

              ## if we're the very last test in the entire _this.tests
              ## we wait until the root suite fires
              ## else we wait until the very last possible moment by waiting
              ## until the root suite is the parent of the current suite
              ## since that will bubble up IF we're the last nested suite
              ## else if we arent the last nested suite we fire if we're
              ## the last test
              if (@suite.root and _this.test is _(_this.tests).last()) or
                (@suite.parent?.root and _this.test is _(tests).last()) or
                  (not isLastSuite(@suite) and _this.test is _(tests).last())
                fn = _.wrap fn, (orig, args...) ->
                  testAfterHooks()
                  orig(args...)

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

  return $Runner