@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  do (Cypress) ->

    runnableIdRegExp = /\[(.{3})\]$/

    class Entities.Reporter extends Entities.Model
      initialize: ->
        @listenTo Cypress, "before:run", ->

        @listenTo Cypress, "setup", @receivedRunner

      stop: ->
        @stopListening(Cypress)

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
        @trigger "before:add"

        runner.getRunnables
          onRunnable: (runnable) =>
            runnable.id ?= @getRunnableId(runnable)

            ## force our runner to ignore running this
            ## test if it doesnt have an id!
            runner.ignore(runnable) if not runnable.id

            ## allow to get the original title without the id
            runnable.originalTitle = @originalTitle(runnable)

        @trigger "after:add"

        @listenToOnce runner, "end", ->
          @stopListening(runner)

      runIframeSuite: (iframe, specWindow, remoteIframe, options, fn) ->
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