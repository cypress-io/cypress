@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Runner extends Entities.Model
    defaults: ->
      total: 0
      failed: 0
      passed: 0
      iframes: []

    setTestRunner: (runner) ->
      ## store the test runner as a property on ourselves
      @runner = runner

    startListening: ->
      ## mocha has begun running the specs per iframe
      @runner.on "start", =>

      @runner.on "suite", (suite) =>
        console.warn "suite", suite
        suite.cid = _.uniqueId("suite")
        @trigger "suite:start", suite

      # @runner.on "suite end", (suite) ->
      #   console.warn "suite end", suite

      @runner.on "fail", (test, err) =>
        console.warn("runner has failed", test, err)
        ## set the AssertionError on the test
        test.err = err

      @runner.on "test", (test) =>
        test.cid = _.uniqueId("test")
        @trigger "test", test

      @runner.on "test end", (test) =>
        console.warn "test end", test
        @trigger "test:end", test
      ## start listening to all the pertinent runner events

    stop: ->
      ## remove all the listeners from EventEmitter
      @runner.removeAllListeners()

      ## delete this property
      delete @runner

    start: (iframe) ->
      console.warn "starting", iframe
      @trigger "load:iframe", iframe

    runIframeSuite: (contentWindow) ->
      ## tell our runner to run our iframes mocha suite
      console.info("runIframeSuite", contentWindow.mocha.suite)
      @runner.runSuite contentWindow.mocha.suite, ->
        console.log "finished running the iframes suite!"

  API =
    getRunner: (testRunner) ->
      ## store the actual testRunner on ourselves
      runner = new Entities.Runner
      runner.setTestRunner testRunner
      runner.startListening()
      runner

  App.reqres.setHandler "runner:entity", (testRunner) ->
    API.getRunner(testRunner)