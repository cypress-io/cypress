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

    getRunnables: (options = {}) ->
      _.defaults options,
        onRunnable: ->

        ## if grep is set (runner.options.grep)  that means the user
        ## has written a .only on a suite or a test, and in that case
        ## we dont want to display the tests or suites unless they match
        ## our grep.
        grep: @grep()

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
      return if runnable.root or runnable.added

      runnable.added = true

      ## tests have a runnable of 'test' whereas suites do not have a runnable property
      runnable.type ?= "suite"

      ## hold onto all of the runnables in a flat array
      ## so we can look this up much faster in the future
      @runnables.push(runnable)

      ## we have optimized this iteration to the maximum.
      ## we memoize the existential matchesGrep property
      ## so we dont do N+1 ops
      matchesGrep = (runnable, grep) ->
        runnable.matchesGrep ?= grep.test(runnable.fullTitle())

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
      @iterateThroughRunnables(runnable, options)

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