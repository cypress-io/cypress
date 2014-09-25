@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  emit          = Mocha.Runnable::emit
  uncaught      = Mocha.Runner::uncaught
  assertProto   = chai.Assertion::assert if chai
  expect        = chai.expect
  assert        = chai.assert
  ## still need to do should here...

  overloadMochaRunnableEmit = ->
    ## if app evironment is development we need to list to errors
    ## emitted from all Runnable inherited objects (like hooks)
    ## this makes tracking down Eclectus related App errors much easier
    Mocha.Runnable::emit = _.wrap emit, (orig, event, err) ->
      switch event
        when "error" then throw err

      orig.call(@, event, err)

  overloadMochaRunnerEmit = ->
    Mocha.Runner::emit = _.wrap emit, (orig, args...) ->
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
      throw err

      orig.call(@, err)

  overloadChaiAssertions = (Ecl) ->
    chai.use (_chai, utils) ->
      _.each {expect: expect, assert: assert}, (value, key) ->
        _chai[key] = _.wrap value, (orig, args...) ->

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
            when args[0] instanceof $("iframe.iframe-spec")[0]?.contentWindow.$
              args[0] = $(args[0])

          orig.apply(@, args)

      _chai.Assertion::assert = _.wrap assertProto, (orig, args...) ->
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
    start: ->
      ## reset df to a new deferred instance
      # df = $.Deferred()

      ## instantiate Eclectus
      window.Ecl = new Eclectus

      overloadMochaRunnableEmit() if App.env("web")
      overloadMochaRunnerEmit()
      overloadMochaRunnerUncaught() if App.env("web")
      overloadChaiAssertions(Ecl) if chai and chai.use

      ## start running the tests
      if App.env("ci")
        runner = window.mochaPhantomJS.run()
      else
        ## set global mocha with our custom reporter
        window.mocha = new Mocha reporter: Reporter

        runner = mocha.run()

      ## return our runner entity
      return App.request("runner:entity", runner, mocha.options, Eclectus.patch, Eclectus.hook, Eclectus.sandbox)

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