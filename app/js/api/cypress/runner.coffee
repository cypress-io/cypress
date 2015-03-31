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
        Cypress.set(hook, @hook)
        Cypress.trigger "hook:start", hook

      @runner.on "hook end", (hook) ->
        Cypress.trigger "hook:end", hook

      @runner.on "test", (test) =>
        Cypress.set(test, @hook)
        Cypress.trigger "test:start", test

      @runner.on "test end", (test) ->
        Cypress.trigger "test:end", test

    ## returns each runnable to the callback function
    ## if it matches the current grep
    ## subsequent runnable iterations are optimized
    getRunnables: (options = {}) ->
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