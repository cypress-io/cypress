@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  ## set our df closure to null
  df = null

  emit      = Mocha.Runnable::emit
  uncaught  = Mocha.Runner::uncaught
  assert    = chai.Assertion::assert if chai

  overloadMochaRunnableEmit = ->
    ## if app evironment is development we need to list to errors
    ## emitted from all Runnable inherited objects (like hooks)
    ## this makes tracking down Eclectus related App errors much easier
    Mocha.Runnable::emit = _.wrap emit, (orig, event, err) ->
      if event is "error"
        throw err

      orig.call(@, event, err)

  overloadMochaRunnerUncaught = ->
    ## if app environment is development we need to listen to
    ## uncaught exceptions (else it makes tracking down bugs hard)
    Mocha.Runner::uncaught = _.wrap uncaught, (orig, err) ->
      throw err

      orig.call(@, err)

  overloadChaiAssertions = (Ecl) ->
    chai.use (_chai, utils) ->
      _chai.Assertion::assert = _.wrap assert, (orig, args...) ->
        passed    = utils.test(@, args)
        value     = utils.flag(@, "object")
        expected  = args[3]
        message   = utils.getMessage(@, args)
        actual    = utils.getActual(@, args)

        Ecl.assert passed, message, value, actual, expected
        orig.apply(@, args)

  class Reporter
    constructor: (runner) ->
      ## we need to have access to the methods we need to partial
      ## each time our tests / suites / hooks run
      patch = Eclectus.patch
      sandbox = Eclectus.sandbox

      ## resolve the promise with our bona-fide
      ## runner entity which will manage the lifecycle
      ## of our test runner
      df.resolve App.request("runner:entity", runner, patch, sandbox)

  API =
    ## the start method will be responsible for setting up
    ## the ability to run tests based on our test framework
    ## ATM its hard coded to work with Mocha
    start: ->
      ## reset df to a new deferred instance
      df = $.Deferred()

      ## instantiate Eclectus
      window.Ecl = new Eclectus

      ## set global mocha with our custom reporter
      window.mocha = new Mocha reporter: Reporter

      overloadMochaRunnableEmit()
      overloadMochaRunnerUncaught()
      overloadChaiAssertions(Ecl) if chai and chai.use

      ## start running the tests
      mocha.run()

      return df

    stop: (runner) ->
      ## call the stop method which cleans up any listeners
      runner.stop()

      ## delete the globals to cleanup memory
      delete window.Ecl
      delete window.mocha

  App.reqres.setHandler "start:test:runner", ->
    API.start()

  App.reqres.setHandler "stop:test:runner", (runner) ->
    API.stop(runner)