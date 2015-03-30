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
      ## hold onto the tests for faster lookup later
      @tests = []

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
        onSuite: ->
        onTest: ->

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
      runnable.type = runnable.type ? "suite"

      ## we need to change our strategy of displaying runnables
      ## if grep is set (runner.options.grep)  that means the user
      ## has written a .only on a suite or a test, and in that case
      ## we dont want to display the tests or suites unless they match
      ## our grep.
      grep = @grep()

      ## trigger the add events so our UI can begin displaying
      ## the tests + suites
      if runnable.type is "suite"
        count = 0
        runnable.eachTest (test) ->
          count += 1 if grep.test(test.fullTitle())
        options.onRunnable(runnable) if count > 0

      if runnable.type is "test"
        if grep.test(runnable.fullTitle())
          @tests.push(runnable)
          options.onRunnable(runnable)

      ## recursively apply to all tests / suites of this runnable
      @iterateThroughRunnables(runnable, options)

    grep: ->
      ## grab grep from the mocha runner
      ## or just set it to all in case
      ## there is a mocha regression
      @runner._grep ? /.*/

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