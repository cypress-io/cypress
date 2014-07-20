@App.module "TestSpecsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application

    initialize: (options) ->
      { runner } = options

      ## use a collection as the container of all of our suites
      suites = App.request "new:suite:entities"

      @listenTo runner, "all", (e) -> console.info e

      @listenTo runner, "suite:start", (suite) ->
        ## bail if we're the root suite
        ## we dont care about that one
        return if suite.root

        ## push this suite into our suites collection
        console.log "suite start", suite, suite.cid, suites
        suites.addSuite(suite)

      @listenTo runner, "test", (test) ->
        suites.addTest(test)

      @listenTo runner, "test:end", (test) ->
        console.log "test:end", test
        ## sets the internal state of the test's results
        suites.getTest(test).getResults(test)

        ## updates the parent suites state
        suites.getSuiteByTest(test).updateState()

      suitesView = @getSuitesView suites

      @show suitesView

    getSuitesView: (suites) ->
      new List.Suites
        collection: suites