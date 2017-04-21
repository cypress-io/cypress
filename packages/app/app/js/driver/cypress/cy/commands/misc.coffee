$Cypress.register "Misc", (Cypress, _, $) ->

  Cypress.addDualCommand
    end: ->
      null

  Cypress.addParentCommand
    noop: (subject) -> subject

    log: (msg, args) ->
      Cypress.Log.command({
        end: true
        snapshot: true
        message: [msg, args]
        consoleProps: ->
          {
            message: msg
            args:    args
          }
      })

      return null

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
