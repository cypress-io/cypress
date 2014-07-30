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
        @addRunnable(suite, "suite")

      @listenTo runner, "suite:stop", (suite) ->
        return if suite.root or suite.stopped

        ## when our suite stop update its state
        ## based on all the tests that ran
        suite.model.updateState()

      # add the test to the suite unless it already exists
      @listenTo runner, "test", (test) ->
        ## add the test to the list of runnables
        @addRunnable(test, "test")

      @listenTo runner, "test:end", (test) ->
        return if test.stopped or not test.model

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

        @resetRunnables(runnables)

      runnableView = @getRunnableView root

      @show runnableView

    resetRunnables: (runnables) ->
      while runnables.length
        runnables.pop()

    addRunnable: (root, runnables, runnable, type) ->
      ## we need to bail here because this is most likely due
      ## to the user changing their tests and the old test
      ## are still running...
      return if runnable.root or runnable.stopped

      ## if the suite or tests' parent is already a runnable
      ## we know its a nested suite / test
      if runnable.parent in runnables
        runnable.parent.model.addRunnable runnable, type
      else
        ## bail if our parent isnt the root
        ## this happens when old tests aren't stopped
        ## or pended fast enough
        return if not runnable.parent.root

        ## it needs to go on the root if its parent is the root
        root.addRunnable runnable, type

      runnables.push runnable

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
      new List.Root
        model: root