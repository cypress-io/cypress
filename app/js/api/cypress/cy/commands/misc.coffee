$Cypress.register "Misc", (Cypress, _, $) ->

  Cypress.addDualCommand
    end: ->
      null

  Cypress.addParentCommand
    options: (options = {}) ->
      ## change things like pauses in between commands
      ## the max timeout per command
      ## or anything else here...

    noop: (subject) -> subject

    wrap: (subject, options = {}) ->
      _.defaults options, {log: true}

      remoteSubject = @getRemotejQueryInstance(subject)

      if options.log isnt false
        options._log = Cypress.Log.command()

        if Cypress.Utils.hasElement(subject)
          options._log.set({$el: subject})

      do resolveWrap = =>
        @verifyUpcomingAssertions(subject, options, {
          onRetry: resolveWrap
        })