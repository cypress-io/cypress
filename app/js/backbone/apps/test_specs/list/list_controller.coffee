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
        console.log "test:end", test, test.cid, suites
        ## sets the internal state of the test's results
        testModel = suites.getTest(test)
        testModel.setResults(test)

        ## updates the parent suites state
        suites.getSuiteByTest(test).updateState()

        ## causes the runner to fire 'test:results:ready' after we've
        ## normalized the test results in our own testModel
        runner.logResults testModel
      suitesView = @getSuitesView suites

      ## when a suite is clicked, we choose the suite
      ## and unchoose all of the other tests
      @listenTo suitesView, "childview:suite:clicked", (iv, args) ->
        suite = args.model
        suites.unchooseTests()
        suite.choose()

      ## when a test is clicked, we unchoose any suite
      ## and then choose the test
      @listenTo suitesView, "childview:childview:test:clicked", (iv, iv2, args) ->
        test = args.model
        chosen = suites.getFirstChosen()
        suites.unchoose(chosen) if chosen
        test.choose()
        runner.setChosenId test.id

      @show suitesView

    getSuitesView: (suites) ->
      new List.Suites
        collection: suites