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
      console.warn "listening to runner!", @runner
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
      @runner.runSuite contentWindow.mocha.suite, ->
        console.log "running the iframes suite!"

  API =
    getRunner: (testRunner) ->
      ## store the actual testRunner on ourselves
      runner = new Entities.Runner
      runner.setTestRunner testRunner
      runner.startListening()
      runner

  App.reqres.setHandler "runner:entity", (testRunner) ->
    API.getRunner(testRunner)