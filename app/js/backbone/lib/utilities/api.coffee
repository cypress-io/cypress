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

      ## start running the tests
      mocha.run()

      return df

    stop: (runner) ->
      console.warn "stopping runner", runner
      ## call the stop method which cleans up any listeners
      runner.stop()

      ## delete the globals to cleanup memory
      delete window.Ecl
      delete window.mocha

  App.reqres.setHandler "start:test:runner", ->
    API.start()

  App.reqres.setHandler "stop:test:runner", (runner) ->
    API.stop(runner)