Cypress.Runner = do (Cypress, _) ->

  Cypress.on "fail", (err, runnable) ->
    Cypress.getRunner().fail(err, runnable)

  Cypress.on "abort", ->
    Cypress.getRunner().abort()

  Cypress.on "destroy", ->
    Cypress.getRunner().destroy()
    Cypress._runner = null

  class Runner
    constructor: (@runner) ->
      ## hold onto the runnables for faster lookup later
      @runnables = []

      @patchHookEvents()

      @getRunnables()

    fail: (err, runnable) ->
      runnable.err = err

      @runner.uncaught(err)

    destroy: ->
      @runner.removeAllListeners()

    abort: ->
      @runner.abort()

    run: (fn) ->
      @setListeners()

      @runner.startRunner(fn)

    setListeners: ->
      ## mocha has begun running the tests
      @runner.on "start", =>
        Cypress.trigger "run:start"

      ## mocha has finished running the tests
      @runner.on "end", =>
        Cypress.trigger "run:end"

      @runner.on "suite", (suite) ->
        Cypress.trigger "suite:start", suite

      @runner.on "suite end", (suite) ->
        Cypress.trigger "suite:end", suite

      @runner.on "hook", (hook) =>
        Cypress.set(hook, @hookName)
        Cypress.trigger "hook:start", hook

      @runner.on "hook end", (hook) ->
        Cypress.trigger "hook:end", hook

      @runner.on "test", (test) =>
        @test     = test
        @hookName = "test"

        Cypress.set(test, @hookName)
        Cypress.trigger "test:start", test

      @runner.on "test end", (test) ->
        Cypress.trigger "test:end", test

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
            @tests.push(runnable)
            options.onRunnable(runnable)

      ## recursively apply to all tests / suites of this runnable
      ## unless we've been told not to iterate (during optimized loop)
      @iterateThroughRunnables(runnable, options) if options.iterate

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
      # debugger
      ## if theres already a currentTest use that
      return test if test = hook?.ctx.currentTest

      ## there is a bug where if you have set an 'only'
      ## and you're running a visit within a hook
      ## then this will return the incorrect test
      ## it will return the very first test instead of
      ## our actual running test.  i've looked through
      ## mocha's source and cannot find any way to figure
      ## out which test is running in this scenario.
      ## so i think the only solution is to look at the grep
      ## and grep for the first test that matches it
      # grep = @runner._grep
      # if grep.toString() isnt "/.*/"
      #   return test if test = @getFirstTestByFn suite, (test) ->
      #     grep.test _.result(test, "fullTitle")
      @tests[0]

      ## else go look for the test because our suite
      ## is most likely the root suite (which does not share a ctx)
      # if suite.tests.length
      #   return suite.tests[0]
      # else
      #   @getTestFromHook(hook, suite.suites[0])

    patchHookEvents: ->
      ## monkey patch the hook event so we can wrap
      ## 'test:before:hooks' and 'test:after:hooks' around all of
      ## the hooks surrounding a test runnable
      runner = @

      # count = 0
      @runner.hook = _.wrap @runner.hook, (orig, name, fn) ->
        # if name is "afterAll"
        #   count += 1
        #   console.log name + ": #{count}"
        # debugger
        hooks = @suite["_" + name]

        getAllTests = (suite) ->
          tests = []
          suite.eachTest (test) ->
            ## iterate through each of our suites tests.
            ## this will iterate through all nested tests
            ## as well.  and then we add it only if its
            ## in our grepp'd runner.tests array
            tests.push(test) if test in runner.tests
          tests

        ## we have to see if this is the last suite amongst
        ## its siblings.  but first we have to filter out
        ## suites which dont have a grep'd test in them
        isLastSuite = (suite) ->
          ## grab all of the suites from our grep'd tests
          ## including all of their ancestor suites!
          suites = _.reduce runner.tests, (memo, test) ->
            while parent = test.parent
              memo.push(parent)
              test = parent
            memo
          , []

        #   ## intersect them with our parent suites and see if the last one is us
        #   _.chain(suites).uniq().intersection(suite.parent.suites).last().value() is suite

        testBeforeHooks = (hook, suite) ->
          runner.test = runner.getTestFromHook(hook, suite) if not runner.test

          # debugger
          Cypress.trigger "test:before:hooks", runner.test

        testAfterHooks = ->
          Cypress.trigger "test:after:hooks", runner.test

          @test     = null
          @hookName = null

          Cypress.restore()

        switch name
          when "beforeAll"
            ## if we're the root suite we know to fire
            if @suite.root
              testBeforeHooks(hooks[0], @suite)

          when "beforeEach"
            if @suite.root and runner.test isnt runner.tests[0]
              testBeforeHooks(hooks[0], @suite)

          when "afterEach"
            ## find all of the grep'd runner tests which share
            ## the same parent suite as our current runner test
            tests = getAllTests(runner.test.parent)

            ## make sure this test isnt the last test overall but also
            ## isnt the last test in our grep'd parent suite's tests array
            if @suite.root and (runner.test isnt _(runner.tests).last()) and (runner.test isnt _(tests).last())
              fn = _.wrap fn, (orig, args...) ->
                testAfterHooks()
                orig(args...)

          when "afterAll"
            ## find all of the grep'd runner tests which share
            ## the same parent suite as our current runner test
            if runner.test

              tests = getAllTests(runner.test.parent)

              ## if we're the very last test in the entire runner.tests
              ## we wait until the root suite fires
              ## else we wait until the very last possible moment by waiting
              ## until the root suite is the parent of the current suite
              ## since that will bubble up IF we're the last nested suite
              ## else if we arent the last nested suite we fire if we're
              ## the last test
              if (@suite.root and runner.test is _(runner.tests).last()) or
                (@suite.parent.root and runner.test is _(tests).last()) or
                  (not isLastSuite(@suite) and runner.test is _(tests).last())
                fn = _.wrap fn, (orig, args...) ->
                  testAfterHooks()
                  orig(args...)

        orig.call(@, name, fn)

    override: ->
      @_abort = @abort
      @abort = ->
      @

    restore: ->
      if @_abort
        @abort = @_abort
      @

    @runner = (runner) ->
      Cypress._runner = new Runner(runner)

    @create = (mocha, specWindow) ->
      mocha.reporter(->)
      runner = mocha.run()
      runner.suite = specWindow.mocha.suite
      @runner(runner)

  Cypress.getRunner = ->
    @_runner ? throw new Error("Cypress._runner instance not found!")

  return Runner