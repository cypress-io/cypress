$Cypress.register "Misc", (Cypress, _, $) ->

  Cypress.addDualCommand
    end: ->
      null

  Cypress.addParentCommand
    options: (options = {}) ->
      ## change things like pauses in between commands
      ## the max timeout per command
      ## or anything else here...

    noop: (obj) -> obj

    wrap: (obj, options = {}) ->
      _.defaults options, {log: true}

      if options.log
        options.command = Cypress.Log.command()

        if Cypress.Utils.hasElement(obj)
          options.command.set({$el: obj})

      do resolveWrap = =>
        @verifyUpcomingAssertions(obj, options, {
          onRetry: resolveWrap
        })