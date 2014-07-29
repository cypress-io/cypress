@App.module "TestSpecsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application

    initialize: (options) ->
      { runner } = options

      ## hold onto every single runnable type (suite or test)
      runnables  = []

      root = App.request "new:root:runnable:entity"

      console.warn "root", root

      ## use a collection as the container of all of our suites
      suites = App.request "new:suite:entities"

      ## always make the first two arguments the root model + runnables array
      @addRunnable = _.partial(@addRunnable, root, runnables)

      @listenTo runner, "all", (e) -> console.info e

      @listenTo runner, "suite:start", (suite) ->
        ## bail if we're the root suite
        ## we dont care about that one
        # return @createRootRunnable(suite) if suite.root
        return if suite.root

        ## push this suite into our suites collection
        console.log "suite start", suite, suite.cid, suite.title, suites
        # suites.addSuite(suite)
        ## add the suite to the list of suites
        @addRunnable(suite, "suite")

      @listenTo runner, "suite:stop", (suite) ->
        return if suite.root

        ## when our suite stop update its state
        ## based on all the tests that ran
        suite.model.updateState()

      # add the test to the suite unless it already exists
      @listenTo runner, "test", (test) ->
        ## add the test to the list of runnables
        @addRunnable(test, "test")

      @listenTo runner, "test:end", (test) ->
        ## set the results of the test on the test client model
        ## passed | failed | pending
        test.model.setResults(test)

        ## this logs the results of the test
        ## and causes our runner to fire 'test:results:ready'
        runner.logResults test.model

      #   console.log "test:end", test, test.cid, suites
      #   ## sets the internal state of the test's results
      #   testModel = suites.getTest(test)
      #   testModel.setResults(test)

      #   ## updates the parent suites state
      #   suites.getSuiteByTest(test).updateState()

      #   ## causes the runner to fire 'test:results:ready' after we've
      #   ## normalized the test results in our own testModel
      #   runner.logResults testModel

      # @listenTo runner, "load:iframe", (iframe, options) ->
      #   ## when our runner says to load the iframe
      #   ## if nothing is chosen -- reset everything
      #   ## if just a test is chosen -- just clear/reset its attributes
      #   ## if a suite is chosen -- reset all of the tests attrs

      #   if runner.hasChosen() then suites.resetTestsOrClearOne() else suites.reset()

      # suitesView = @getSuitesView suites
      runnableView = @getRunnableView root

      # ## when a suite is clicked, we choose the suite
      # ## and unchoose all of the other tests
      # @listenTo suitesView, "childview:suite:clicked", (iv, args) ->
      #   suite = args.model
      #   suites.unchooseTests()
      #   suite.choose()
      #   runner.setChosenId suite.id

      # ## when a test is clicked, we unchoose any suite
      # ## and then choose the test
      # @listenTo suitesView, "childview:childview:test:clicked", (iv, iv2, args) ->
      #   test = args.model
      #   currentlyChosen = suites.getFirstChosen()
      #   suites.unchoose(currentlyChosen) if currentlyChosen
      #   test.toggleChoose()
      #   runner.setChosenId test.id

      @show runnableView
      # @show suitesView

    # createRootRunnable: (suite) ->

    addRunnable: (root, runnables, runnable, type) ->
      ## add runnable to runnables array which holds onto
      ## every single suite + test
      runnables.push runnable

      ## if the suite or tests' parent is already a runnable
      ## we know its a nested suite / test
      if runnable.parent in runnables
        runnable.parent.model.addRunnable runnable, type
      else
        ## it needs to go on the root
        root.addRunnable runnable, type

    getRunnableView: (root) ->
      new List.Runnable
        model: root

    # getSuitesView: (suites) ->
    #   new List.Suites
    #     collection: suites