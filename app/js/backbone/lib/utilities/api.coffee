@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  ## set our df closure to null
  df = null

  class Reporter
    constructor: (runner) ->
      ## resolve the promise with our bona-fide
      ## runner entity which will manage the lifecycle
      ## of our test runner
      df.resolve App.request("runner:entity", runner)

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

      ## if app evironment is development we need to list to errors
      ## emitted from all Runnable inherited objects (like hooks)
      ## this makes tracking down Eclectus related App errors much easier
      Mocha.Runnable::emit = _.wrap Mocha.Runner::emit, (orig, event, err) ->
        if event is "error"
          throw err

        orig.call(@, event, err)

      ## if app environment is development we need to listen to
      ## uncaught exceptions (else it makes tracking down bugs hard)
      Mocha.Runner::uncaught = _.wrap Mocha.Runner::uncaught, (orig, err) ->
        throw err

        orig.call(@, err)

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