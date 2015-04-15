@App.module "TestSpecsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application

    initialize: (options) ->
      { reporter, spec } = options

      ## hold onto every single runnable type (suite or test)
      container  = App.request "runnable:container:entity"

      ## generate the root runnable which holds everything
      root = App.request "new:root:runnable:entity"

      ## grab the commands collection from the reporter
      { commands, routes, agents} = reporter

      ## when commands are added to this collection
      ## we need to find the runnable model by its id
      ## and then add this command model to the runnable model
      @listenTo commands, "add", (command, commands, options) ->
        model = container.get command.get("testId")
        return if not model

        command = model.addCommand(command, options)

        ## if this command is a request then
        ## lets update our routes
        ## TODO REFACTOR THIS INTO NEW LOG INTERFACE
        if route = command and command.getRoute()
          model.incrementRoute(route)

      @listenTo routes, "add", (route, routes, options) ->
        model = container.get route.get("testId")
        model.addRoute(route, options) if model

      @listenTo agents, "add", (agent, agents, options) ->
        model = container.get agent.get("testId")
        model.addAgent(agent, options) if model

      ## always make the first two arguments the root model + container collection
      @addRunnable = _.partial(@addRunnable, root, container)

      ## always make the first two arguments the reporter + container collection
      @createRunnableListeners = _.partial(@createRunnableListeners, reporter, container)

      ## always make the first argument the reporter
      @insertChildViews = _.partial(@insertChildViews, reporter)

      @listenTo reporter, "before:run", ->
        ## move all the models over to previous run
        ## and reset all existing one
        container.reset()

      @listenTo reporter, "after:add", ->
        ## removes any old models no longer in our run
        container.removeOldModels()

        ## if container is empty then we want
        ## to have our runnablesView render its
        ## empty view
        if container.isEmpty()
          runnablesView.renderEmpty = true
          runnablesView.render()

        ## if theres only 1 single test we always
        ## want to choose it so its open by default
        if model = container.hasOnlyOneTest()
          model.open()

      @listenTo reporter, "suite:add", (suite) ->
        @addRunnable(suite, "suite")
      # @listenTo reporter, "suite:start", (suite) ->
        # @addRunnable(suite, "suite")

      @listenTo reporter, "suite:end", (suite) ->
        return if suite.root

        ## when our suite stop update its state
        ## based on all the tests that ran
        container.get(suite.id).updateState()

      # add the test to the suite unless it already exists
      @listenTo reporter, "test:add", (test) ->
        ## add the test to the container collection of runnables
        @addRunnable(test, "test")

      @listenTo reporter, "test:end", (test) ->
        ## find the client runnable model by the test's ide
        runnable = container.get(test.id)

        ## set the results of the test on the test client model
        ## passed | failed | pending
        runnable.setResults(test)

        ## this logs the results of the test
        ## and causes our reporter to fire 'test:results:ready'
        reporter.logResults runnable

      @listenTo reporter, "reset:test:run", ->
        ## when our reporter says to reset the test run
        ## we do this so our tests go into the 'reset' state prior to the iframe
        ## loading -- so it visually looks like things are moving along faster
        ## and it gives a more accurate portrayal of whats about to happen
        ## your tests are going to re-run!
        root.reset()

      runnablesView = @getRunnablesView root, spec

      @show runnablesView

    addRunnable: (root, container, runnable, type) ->
      ## we need to bail here because this is most likely due
      ## to the user changing their tests and the old test
      ## are still running...
      return if runnable.root

      ## add it to our flat container
      ## and figure out where this model should be added
      ## does it go into an existing nested collection?
      ## or does it belong on the root?
      runnable = container.add runnable, type, root

      @createRunnableListeners(runnable)

      @insertChildViews(runnable)

    insertChildViews: (reporter, model) ->
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
          App.execute "list:test:agents", model, layout.agentsRegion

          App.execute "list:test:routes", model, layout.routesRegion

          ## and pass up the commands collection (via hooks) and the commands region
          App.execute "list:test:commands", model, layout.commandsRegion
        else
          region = layout.runnablesRegion

          ## dont replace the current view if theres one in the region
          ## else this would cause all of our existing tests to be removed
          return if region.hasView()

          ## repeat the nesting by inserting the collection view again
          runnablesView = @getRunnablesView model
          @show runnablesView, region: region

    createRunnableListeners: (reporter, container, model) ->
      ## unbind everything else we will get duplicated events
      @stopListening model

      ## because we have infinite view nesting we can't really utilize
      ## the view event bus in a reliable way.  thus we have to go through
      ## our models.

      ## we also can't use the normal backbone-chooser because
      ## we have unlimited nested / fragmented collections
      ## so we have to handle this logic ourselves
      @listenTo model, "model:refresh:clicked", ->
        ## always unchoose all other models
        container.each (runnable) ->
          runnable.collapse()
          runnable.unchoose()

        ## choose this model
        model.reset({silent: false})
        model.choose()

        ## pass this id along to reporter
        reporter.setChosen model

    getRunnableContentView: (runnable) ->
      new List.RunnableContent
        model: runnable

    getRunnablesView: (runnable, spec) ->
      new List.Runnables
        model: runnable
        spec: spec