@App.module "TestSpecsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application

    initialize: (options) ->
      { runner } = options

      ## hold onto every single runnable type (suite or test)
      container  = App.request "runnable:container:entity"

      ## generate the root runnable which holds everything
      root = App.request "new:root:runnable:entity"

      ## use a collection as the container of all of our suites
      suites = App.request "new:suite:entities"

      ## grab the commands collection from the runner
      commands = runner.getCommands()

      ## when commands are added to this collection
      ## we need to find the runnable model by its cid
      ## and then add this command model to the runnable model
      @listenTo commands, "add", (command) ->
        model = container.get command.get("testId")
        model.addCommand(command) if model

      ## always make the first two arguments the root model + container collection
      @addRunnable = _.partial(@addRunnable, root, container)

      ## always make the first two arguments the runner + container collection
      @createRunnableListeners = _.partial(@createRunnableListeners, runner, container)

      ## always make the first argument the runner
      @insertChildViews = _.partial(@insertChildViews, runner)

      @listenTo runner, "before:run", ->
        ## move all the models over to previous run
        ## and reset all existing one
        container.reset()

      @listenTo runner, "after:run", ->
        ## removes any old models no longer in our run
        container.removeOldModels()

      @listenTo runner, "suite:add", (suite) ->
        @addRunnable(suite, "suite")
      # @listenTo runner, "suite:start", (suite) ->
        # @addRunnable(suite, "suite")

      @listenTo runner, "suite:stop", (suite) ->
        return if suite.root or suite.stopped

        ## when our suite stop update its state
        ## based on all the tests that ran
        container.get(suite.cid).updateState()

      # add the test to the suite unless it already exists
      @listenTo runner, "test:add", (test) ->
        ## add the test to the container collection of runnables
        @addRunnable(test, "test")

      # @listenTo runner, "test:start", (test) ->
        ## add the test to the container collection of runnables
        # @addRunnable(test, "test")

      @listenTo runner, "test:end", (test) ->
        return if test.stopped

        ## find the client runnable model by the test's cide
        runnable = container.get(test.cid)

        ## set the results of the test on the test client model
        ## passed | failed | pending
        runnable.setResults(test)

        ## this logs the results of the test
        ## and causes our runner to fire 'test:results:ready'
        runner.logResults runnable

      @listenTo runner, "load:iframe", (iframe, options) ->
        ## when our runner says to load the iframe
        ## if nothing is chosen -- reset everything
        ## if just a test is chosen -- just clear/reset its attributes
        ## if a suite is chosen -- reset all of the children runnable attrs

        ## we do this so our tests go into the 'reset' state prior to the iframe
        ## loading -- so it visually looks like things are moving along faster
        ## and it gives a more accurate portrayal of whats about to happen
        ## your tests are going to re-run!
        if runner.hasChosen()
          container.each (model) =>
            if model.isChosen()
              model.reset()
        else
          root.reset()

      runnablesView = @getRunnablesView root

      @show runnablesView

    addRunnable: (root, container, runnable, type) ->
      ## we need to bail here because this is most likely due
      ## to the user changing their tests and the old test
      ## are still running...
      return if runnable.root or runnable.stopped

      ## add it to our flat container
      ## and figure out where this model should be added
      ## does it go into an existing nested collection?
      ## or does it belong on the root?
      runnable = container.add runnable, type, root

      @createRunnableListeners(runnable)

      @insertChildViews(runnable)

    insertChildViews: (runner, model) ->
      ## we could alternatively loop through all of the children
      ## from the root as opposed to going through the model
      ## to receive its layout but that would be much slower
      ## because we have unlimited nesting, unfortunately
      ## this is the easiest way to receive our layout view
      model.trigger "get:layout:view", (layout) =>

        ## insert the content view into the layout
        contentView = @getRunnableContentView(model)
        @show contentView, region: layout.contentRegion

        if model.is("test")
        #   ## and pass up the commands collection and the commands region
          App.execute "list:test:commands", model.get("commands"), runner, layout.commandsRegion
        else
          region = layout.runnablesRegion

          ## dont replace the current view if theres one in the region
          ## else this would cause all of our existing tests to be removed
          return if region.hasView()

          ## repeat the nesting by inserting the collection view again
          runnablesView = @getRunnablesView model
          @show runnablesView, region: region

    createRunnableListeners: (runner, container, model) ->
      ## unbind everything else we will get duplicated events
      @stopListening model

      ## because we have infinite view nesting we can't really utilize
      ## the view event bus in a reliable way.  thus we have to go through
      ## our models.

      ## we also can't use the normal backbone-chooser because
      ## we have unlimited nested / fragmented collections
      ## so we have to handle this logic ourselves
      @listenTo model, "model:double:clicked", ->
        ## always unchoose all other models
        container.each (runnable) ->
          runnable.collapse()
          runnable.unchoose()

        ## choose this model
        model.choose()

        ## pass this id along to runner
        runner.setChosen model

    getRunnableContentView: (runnable) ->
      new List.RunnableContent
        model: runnable

    getRunnablesView: (runnable) ->
      new List.Runnables
        model: runnable