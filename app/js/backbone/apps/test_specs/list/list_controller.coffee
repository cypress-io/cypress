@App.module "TestSpecsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application

    initialize: (options) ->
      { runner } = options

      ## hold onto every single runnable type (suite or test)
      runnables  = []
      runnables.eachModel = (fn) ->
        _.each @, (runnable) ->
          fn runnable.model

      root = App.request "new:root:runnable:entity"

      ## use a collection as the container of all of our suites
      suites = App.request "new:suite:entities"

      ## always make the first two arguments the root model + runnables array
      @addRunnable = _.partial(@addRunnable, root, runnables)

      ## always make the first two arguments the runner + runnables array
      @createRunnableListeners = _.partial(@createRunnableListeners, runner, runnables)

      @listenTo runner, "all", (e) -> console.info e

      @listenTo runner, "suite:start", (suite) ->
        ## bail if we're the root suite
        ## we dont care about that one
        return if suite.root

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

      @listenTo runner, "load:iframe", (iframe, options) ->
        ## when our runner says to load the iframe
        ## if nothing is chosen -- reset everything
        ## if just a test is chosen -- just clear/reset its attributes
        ## if a suite is chosen -- reset all of the children runnable attrs
        if runner.hasChosen()
          runnables.eachModel (model) ->
            model.reset() if model.isChosen()
        else
          root.reset()

      runnableView = @getRunnableView root

      @show runnableView

    addRunnable: (root, runnables, runnable, type) ->
      ## if we're re-running our tests and the cid already exists...
      existingRunnable = _(runnables).find (item) ->
        item.cid is runnable.cid

      ## then splice out the old one which mutates the array
      runnables.splice _(runnables).indexOf(existingRunnable), 1 if existingRunnable

      ## and no matter what push our new runnable into it
      runnables.push runnable

      ## if the suite or tests' parent is already a runnable
      ## we know its a nested suite / test
      if runnable.parent in runnables
        runnable.parent.model.addRunnable runnable, type
      else
        ## it needs to go on the root
        root.addRunnable runnable, type

      @createRunnableListeners(runnable.model)

    createRunnableListeners: (runner, runnables, model) ->
      ## unbind everything else we will get duplicated events
      @stopListening model

      ## because we have infinite view nesting we can't really utilize
      ## the view event bus in a reliable way.  thus we have to go through
      ## our models.  we also can't use the normal backbone-chooser because
      ## we have unlimited nested / fragmented collections
      ## so we have to handle this logic ourselves
      @listenTo model, "model:clicked", =>
        ## we should choose this model if its not currently chosen
        shouldChoose = not model.isChosen()

        ## always unchoose all other models
        runnables.eachModel (runnable) ->
          runnable.unchoose()

        ## choose this model if we should choose it
        model.choose() if shouldChoose

        ## pass this id along to runner
        runner.setChosenId model.id

    getRunnableView: (root) ->
      new List.Runnable
        model: root