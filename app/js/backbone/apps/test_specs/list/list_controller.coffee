@App.module "TestSpecsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application

    initialize: (options) ->
      { runner } = options

      ## use a collection as the container of all of our suites
      suites = App.request "new:suite:entities"

      @listenTo runner, "all", (e) -> console.info e

      ## i think we need to just build up an array of flattened tests
      ## so they're easy to parse later instead of walking through a huge tree
      ## tests = []
      ## on "test", => tests.push(test)

      @listenTo runner, "suite:start", (suite) ->
        ## bail if we're the root suite
        ## we dont care about that one
        return if suite.root

        ## push this suite into our suites collection
        ## need to check if this is an existing suite
        ## which means we're already displayed it
        console.log "suite start", suite, suite.cid, suite.title, suites
        suites.addSuite(suite)

      ## add the test to the suite unless it already exists
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

      @listenTo runner, "load:iframe", (iframe, options) ->
        ## when our runner says to load the iframe
        ## if nothing is chosen -- reset everything
        ## if just a test is chosen -- just clear/reset its attributes
        ## if a suite is chosen -- remove its tests

        if runner.hasChosen() then suites.resetTestsOrClearOne() else suites.reset()

      suitesView = @getSuitesView suites

      ## when a suite is clicked, we choose the suite
      ## and unchoose all of the other tests
      @listenTo suitesView, "childview:suite:clicked", (iv, args) ->
        suite = args.model
        suites.unchooseTests()
        suite.choose()
        runner.setChosenId suite.id

      ## when a test is clicked, we unchoose any suite
      ## and then choose the test
      @listenTo suitesView, "childview:childview:test:clicked", (iv, iv2, args) ->
        test = args.model
        currentlyChosen = suites.getFirstChosen()
        suites.unchoose(currentlyChosen) if currentlyChosen
        test.toggleChoose()
        runner.setChosenId test.id

      @show suitesView

    getSuitesView: (suites) ->
      new List.Suites
        collection: suites