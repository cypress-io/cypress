@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  do (Cypress) ->

    runnableIdRegExp = /\[(.{3})\]$/

    class Entities.Reporter extends Entities.Model
      initialize: ->
        @listenTo Cypress, "before:run", ->
          @trigger "before:run"

        @listenTo Cypress, "setup", @receivedRunner

      start: (specPath) ->
        # @setIframe specPath

        @triggerLoadSpecFrame specPath

      stop: ->
        @stopListening(Cypress)

      triggerLoadSpecFrame: (specPath, options = {}) ->
        _.defaults options,
          chosenId: @get("chosenId")
          browser:  @get("browser")
          version:  @get("version")

        ## clear out the commands
        @commands.reset([], {silent: true})

        ## always reset @options.grep to /.*/ so we know
        ## if the user has removed a .only in between runs
        ## if they havent, it will just be picked back up
        ## by mocha
        @options.grep = /.*/

        ## start the abort process since we're about
        ## to load up in case we're running any tests
        ## right this moment

        ## tells different areas of the app to prepare
        ## for the resetting of the test run
        @trigger "reset:test:run"

        ## tells the iframe view to load up a new iframe
        @trigger "load:spec:iframe", specPath, options

      getRunnableId: (runnable) ->
        ## grab the test id from the test's title
        matches = runnableIdRegExp.exec(test.title)

        ## use the captured group if there was a match
        matches and matches[1]

      idSuffix: (id) ->
        " [" + id + "]"

      ## strip out the id suffix from the runnable title
      originalTitle: (runnable) ->
        _.rtrim runnable.title @idSuffix(runnable.id)

      receivedRunner: (runner, fn) ->
        ## dont trigger anything if we're in CI mode
        return @ if App.config.ui("ci")

        @trigger "before:add"

        runner.getRunnables
          onRunnable: (runnable) =>
            runnable.id ?= @getRunnableId(runnable)

            ## force our runner to ignore running this
            ## test if it doesnt have an id!
            runner.ignore(runnable) if not runnable.id

            ## allow to get the original title without the id
            runnable.originalTitle = @originalTitle(runnable)

            @trigger "#{runnable.type}:add", runnable

        @trigger "after:add"

        return @

      ## used to be called runIframeSuite
      run: (iframe, specWindow, remoteIframe, options, fn) ->
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