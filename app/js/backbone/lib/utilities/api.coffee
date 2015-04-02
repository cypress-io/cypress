@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  API =
    ## the start method will be responsible for setting up
    ## the ability to run tests based on our test framework
    ## ATM its hard coded to work with Mocha
    start: (options) ->
      ## get the runner and mocha variables if they're not
      ## passed into our options.  options will normally be
      ## null, but its helpful in testing
      Mocha = options.Mocha ?= window.Mocha

      ## create the global cy variable
      Cypress.init(Mocha)

      Utilities.Overrides.overloadMochaRunnableEmit() if not App.config.ui("ci")
      Utilities.Overrides.overloadMochaRunnerEmit()
      Utilities.Overrides.overloadMochaRunnerUncaught() if not App.config.ui("ci")

      ## return our reporter entity
      return App.request("reporter:entity")

    # getRunner: ->
    #   ## start running the tests
    #   if App.config.ui("ci")
    #     runner = window.mochaPhantomJS.run()
    #   else
    #     ## set global mocha with our custom reporter
    #     window.mocha = new Mocha reporter: Reporter

    #     runner = mocha.run()

    #   return runner

    stop: (runner) ->
      ## TODO MOVE ALL OF THIS LOGIC INTO CYPRESS!!!!

      ## restore chai to the normal expect / assert

      ## resets cypress to remove all references to other objects
      ## including cy
      Cypress.stop()

      ## call the stop method which cleans up any listeners
      runner.stop()

      ## remove any listeners from the mocha.suite
      mocha.suite.removeAllListeners()

      ## null it out to break any references
      mocha.suite = null

      ## delete the globals to cleanup memory
      delete window.mocha

  App.reqres.setHandler "start:test:runner", (options = {}) ->
    API.start options

  App.reqres.setHandler "stop:test:runner", (runner) ->
    API.stop(runner)