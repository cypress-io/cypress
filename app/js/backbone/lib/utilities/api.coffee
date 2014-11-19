@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  runnableEmit  = Mocha.Runnable::emit
  runnerEmit    = Mocha.Runner::emit
  hook          = Mocha.Runner::hook
  uncaught      = Mocha.Runner::uncaught
  assertProto   = chai.Assertion::assert if chai
  expect        = chai.expect
  assert        = chai.assert
  ## still need to do should here...

  overloadMochaRunnableEmit = ->
    ## if app evironment is development we need to list to errors
    ## emitted from all Runnable inherited objects (like hooks)
    ## this makes tracking down Eclectus related App errors much easier
    Mocha.Runnable::emit = _.wrap runnableEmit, (orig, event, err) ->
      switch event
        when "error" then throw err

      orig.call(@, event, err)

  overloadMochaRunnerEmit = ->
    Mocha.Runner::emit = _.wrap runnerEmit, (orig, args...) ->
      event = args[0]

      switch event
        ## if the end event was triggered by mocha
        ## then back it up and wait for our own
        ## runner to fire the eclectus end event
        when "end"
          return

        ## when our runner fires this custom event
        ## then we know we're truly done and should
        ## callback the original end event
        when "eclectus end"
          orig.call(@, "end")

      orig.apply(@, args)

  overloadMochaRunnerUncaught = ->
    ## if app environment is development we need to listen to
    ## uncaught exceptions (else it makes tracking down bugs hard)
    Mocha.Runner::uncaught = _.wrap uncaught, (orig, err) ->
      console.error(err.stack)

      orig.call(@, err)

  overloadChaiAssertions = (Ecl) ->
    chai.use (_chai, utils) ->
      _.each {expect: expect, assert: assert}, (value, key) ->
        _chai[key] = _.wrap value, (orig, args...) ->

          try
            switch
              ## shift the expectation to use the $el on
              ## the command
              when args[0] and args[0].isCommand?()
                args[0] = args[0]._$el

              ## chai-jquery hard codes checking instanceof's
              ## and would always return false if we're receiving
              ## a child jQuery object -- so we need to reset
              ## this object to a jQuery instance that the parent
              ## window controls
              when args[0] instanceof $("iframe#iframe-remote")[0]?.contentWindow.$
                args[0] = $(args[0])
          catch e

          orig.apply(@, args)

      _chai.Assertion::assert = _.wrap assertProto, (orig, args...) ->
        ## we only want to shift the arguments and send these
        ## off to Ecl.assert if it exists (which it wont in our
        ## own test mode)

        if Ecl and Ecl.assert
          passed    = utils.test(@, args)
          value     = utils.flag(@, "object")
          expected  = args[3]

          ## shift the selector as the object
          ## if it has one
          if value and value.selector
            @_obj = value.selector

          message   = utils.getMessage(@, args)

          ## reset the obj to the old value
          ## if it was mutated
          @_obj = value if @_obj isnt value

          actual    = utils.getActual(@, args)

          Ecl.assert passed, message, value, actual, expected

        orig.apply(@, args)

  class Reporter
    constructor: (runner) ->
      ## we need to have access to the methods we need to partial
      ## each time our tests / suites / hooks run
      # patch = Eclectus.patch
      # sandbox = Eclectus.sandbox

      ## resolve the promise with our bona-fide
      ## runner entity which will manage the lifecycle
      ## of our test runner
      # df.resolve App.request("runner:entity", runner, patch, sandbox)

  API =
    ## the start method will be responsible for setting up
    ## the ability to run tests based on our test framework
    ## ATM its hard coded to work with Mocha
    start: (options) ->
      ## instantiate Eclectus
      window.Ecl = new Eclectus
      window.cy  = new Cypress

      overloadMochaRunnableEmit() if not App.config.env("ci")
      overloadMochaRunnerEmit()
      overloadMochaRunnerUncaught() if not App.config.env("ci")
      overloadChaiAssertions(Ecl) if chai and chai.use

      ## get the runner and mocha variables if they're not
      ## passed into our options.  options will normally be
      ## null, but its helpful in testing
      runner = options.runner ?= API.getRunner()
      mocha  = options.mocha ?= window.mocha

      ## return our runner entity
      return App.request("runner:entity", runner, mocha.options, Eclectus.patch, Eclectus.hook, Eclectus.restore)

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
      chai.expect = expect
      chai.assert = assert
      chai.Assertion::assert = assertProto

      ## unpatch eclectus to remove any current partial'd objects
      Eclectus.unpatch()

      ## call the stop method which cleans up any listeners
      runner.stop()

      ## remove any listeners from the mocha.suite
      mocha.suite.removeAllListeners()

      ## null it out to break any references
      mocha.suite = null

      ## delete the globals to cleanup memory
      delete window.Ecl
      delete window.mocha

  App.reqres.setHandler "start:test:runner", (options = {}) ->
    API.start options

  App.reqres.setHandler "stop:test:runner", (runner) ->
    API.stop(runner)