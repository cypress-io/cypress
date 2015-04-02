@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  do (Cypress) ->

    runnableIdRegExp = /\[(.{3})\]$/

    CypressEvents = "run:start run:end suite:start suite:end hook:start hook:end test:start test:end".split(" ")

    class Entities.Reporter extends Entities.Model
      defaults:
        browser: null
        version: null

      initialize: ->
        @commands         = App.request "command:entities"
        @routes           = App.request "route:entities"
        @agents           = App.request "agent:entities"

        _.each CypressEvents, (event) =>
          @listenTo Cypress, event, (args...) =>
            @trigger event, args...

        @listenTo Cypress, "setup", _.bind(@receivedRunner, @)

        @listenTo Cypress, "log", (log) =>
          switch log.get("event")
            when "command"
              ## think about moving this line
              ## back into Cypress
              # log.set "hook", @hookName
              @commands.add log

            when "route"
              @routes.add log

            when "agent"
              @agents.add log

            else
              throw new Error("Cypress.log() emitted an unknown event: #{log.get('event')}")

        @listenTo App.request("socket:entity"), "test:changed", @reRun

      start: (specPath) ->
        @triggerLoadSpecFrame specPath

      stop: ->
        @restore()

        ## stop listening to everything
        ## currently we're only listening to Cypress
        ## but its fine in case we listen to other
        ## objects in the future
        @stopListening()

      restore: ->
        ## reset the entities
        @reset()

        ## and remove actual references to them
        _.each ["commands", "routes", "agents", "chosen", "specPath"], (obj) =>
          @[obj] = null

      reset: ->
        _.each [@commands, @routes, @agents], (collection) ->
          collection.reset([], {silent: true})

      getChosen: ->
        @chosen

      hasChosen: ->
        !!@get("chosenId")

      updateChosen: (id) ->
        ## set chosenId as runnable if present else unset
        if id then @set("chosenId", id) else @unset("chosenId")

      setChosen: (runnable) ->
        if runnable
          @chosen = runnable
        else
          @chosen = null

        @updateChosen(runnable?.id)

        ## always reload the iframe
        @reRun @specPath

      logResults: (test) ->
        @trigger "test:results:ready", test

      reRun: (specPath, options = {}) ->
        ## abort if we're being told to rerun
        ## tests for a specPath we're not
        ## currently watching
        return if specPath isnt @specPath

        ## when we are re-running we first
        ## need to abort cypress
        Cypress.abort().then =>
          ## start the abort process since we're about
          ## to load up in case we're running any tests
          ## right this moment

          ## tells different areas of the app to prepare
          ## for the resetting of the test run
          @trigger "reset:test:run"

          @triggerLoadSpecFrame(specPath, options)

      triggerLoadSpecFrame: (@specPath, options = {}) ->
        _.defaults options,
          chosenId: @get("chosenId")
          browser:  @get("browser")
          version:  @get("version")

        ## reset our collection entities
        @reset()

        ## tells the iframe view to load up a new iframe
        @trigger "load:spec:iframe", @specPath, options

      getRunnableId: (runnable) ->
        ## grab the runnable id from the runnable's title
        matches = runnableIdRegExp.exec(runnable.title)

        ## use the captured group if there was a match
        matches and matches[1]

      idSuffix: (id) ->
        " [" + id + "]"

      ## strip out the id suffix from the runnable title
      originalTitle: (runnable) ->
        _.rtrim runnable.title, @idSuffix(runnable.id)

      receivedRunner: (runner) ->
        @trigger "before:add"

        runnables = []
        ids = []

        triggerAddEvent = (runnable) =>
          @trigger("#{runnable.type}:add", runnable)

        getRunnables = (options = {}) =>
          _.defaults options,
            pushIds: true
            pushRunnables: true
            triggerAddEvent: true

          ## on the first iteration we want to simply collect
          ## all of the runnable ids, and filter out any runnables
          ## which dont have an id (or a duplicate id?)
          runner.getRunnables
            onRunnable: (runnable) =>
              runnables.push(runnable) if options.pushRunnables

              runnable.id ?= @getRunnableId(runnable)

              ids.push(runnable.id) if options.pushIds

              ## force our runner to ignore running this
              ## test if it doesnt have an id!
              ## or if it has a duplicate id, nuke it including
              ## any children.
              ## just remove the children if its a suite
              # runner.ignore(runnable) if not runnable.id

              ## allow to get the original title without the id
              runnable.originalTitle ?= @originalTitle(runnable)

              triggerAddEvent(runnable) if options.triggerAddEvent

        ## if we have a chosen id
        if @hasChosen()
          id = @get("chosenId")

          ## get our runnables now
          getRunnables({triggerAddEvent: false})

          ## and its an id within our runnables.
          ## we do this to ensure that the user
          ## didnt previously select this test
          ## and then modify the spec and remove
          ## this specific id
          if id in ids
            ## make the runner grep for just this unique id!
            runner.grep @escapeRegExp("[" + id + "]")

            ## get the runnables again since we now
            ## have to iterate through them again
            ## to see which ones should be added
            ## we dont need to push the ids or push
            ## the runnables since its a temp var anyway
            getRunnables({pushIds: false, pushRunnables: false})
          else
            ## remove the chosen id since its not
            ## longer in the spec file!
            @updateChosen()

            ## trigger the triggerAddEvent on all of
            ## our existing runnables!
            _.each runnables, triggerAddEvent
        else
          ## if we havent chosen anything to begin with
          ## then just iterate through all the runnables
          ## and fire away!
          getRunnables()

        @trigger "after:add"

        return @

      escapeRegExp: (str) ->
        new RegExp str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')

      ## used to be called runIframeSuite
      run: (iframe, specWindow, remoteIframe, options, fn) ->
        ## trigger before:run prior to setting up the runner
        @trigger "before:run"

        ## this is where we should automatically patch Ecl/Cy proto's
        ## with the iframe specWindow, and remote iframe
        ## as of now we're passing App.confg into cypress but i dont like
        ## leaking this backbone model's details into the cypress API
        Cypress.setup(specWindow, remoteIframe, App.config.getExternalInterface())

        Cypress.run (err) =>
          ## trigger the after run event
          @trigger "after:run"

          fn?(err)

    App.reqres.setHandler "reporter:entity", ->
      new Entities.Reporter