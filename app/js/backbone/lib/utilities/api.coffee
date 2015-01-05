@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  class Reporter

  API =
    ## the start method will be responsible for setting up
    ## the ability to run tests based on our test framework
    ## ATM its hard coded to work with Mocha
    start: (options) ->
      ## create the global cy variable
      Cypress.start()

      Utilities.Overrides.overloadMochaRunnableEmit() if not App.config.env("ci")
      Utilities.Overrides.overloadMochaRunnerEmit()
      Utilities.Overrides.overloadMochaRunnerUncaught() if not App.config.env("ci")

      Cypress.Chai.override()

      ## get the runner and mocha variables if they're not
      ## passed into our options.  options will normally be
      ## null, but its helpful in testing
      runner = options.runner ?= API.getRunner()
      mocha  = options.mocha ?= window.mocha

      ## return our runner entity
      return App.request("runner:entity", runner, mocha.options)

    getRunner: ->
      ## start running the tests
      if App.config.env("ci")
        runner = window.mochaPhantomJS.run()
      else
        ## set global mocha with our custom reporter
        window.mocha = new Mocha reporter: Reporter

        runner = mocha.run()

      return runner

    stop: (runner) ->
      ## restore chai to the normal expect / assert
      Cypress.Chai.restore()

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