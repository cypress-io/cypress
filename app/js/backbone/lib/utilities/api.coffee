@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  API =
    start: (options) ->
      Utilities.Overrides.overloadMochaRunnableEmit() if not App.config.ui("ci")
      Utilities.Overrides.overloadMochaRunnerEmit()
      Utilities.Overrides.overloadMochaRunnerUncaught() if not App.config.ui("ci")

      ## create the global cy variable
      Cypress.init()

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

      ## THIS CURRENTLY NEEDS TESTS AND IS BREAKING!
      ## REFACTOR THIS INTO THE CYPRESS.MOCHA MODULE

  App.reqres.setHandler "start:test:runner", (options = {}) ->
    API.start options

  App.reqres.setHandler "stop:test:runner", (runner) ->
    API.stop(runner)