$Cypress.register "Debugging", (Cypress, _, $) ->

  Cypress.on "resume:next", ->
    @resume(false)

  Cypress.on "resume:all", ->
    @resume()

  Cypress.Cy.extend
    resume: (resumeAll = true) ->
      @prop("onResume").call(@, resumeAll)

  Cypress.addUtilityCommand
    ## pause should indefinitely pause until the user
    ## presses a key or clicks in the UI to continue
    pause: (options = {}) ->
      _.defaults options, {log: true}

      if options.log
        options._log = Cypress.Log.command({
          snapshot: true
          autoEnd: false
        })

      onResume = (fn, timeout) =>
        @prop "onResume", (resumeAll) ->
          if resumeAll
            ## nuke onPause only if
            ## we've been told to resume
            ## all the commands, else
            ## pause on the very next one
            @prop("onPaused", null)

            if options.log
              options._log.end()

          ## restore timeout
          @_timeout(timeout)

          ## invoke callback fn
          fn.call(@)

      @prop "onPaused", (fn) ->
        next = @prop("current").get("next")

        if next and @isCommandFromMocha(next)
          return fn.call(@)

        Cypress.trigger("paused", next?.get("name"))

        ## backup the current timeout
        timeout = @_timeout()

        ## clear out the current timeout
        @_clearTimeout()

        ## set onResume function
        onResume(fn, timeout)

      return @prop("subject")

    inspect: ->
      ## bug fix due to 3rd party libs like
      ## chai using inspect function for
      ## special display
      # return "" if not @prop

      @prop("inspect", true)
      return null

    debug: ->
      console.log "\n%c------------------------Cypress Command Info------------------------", "font-weight: bold;"
      console.log "Runnable:           ", @private("runnable")
      console.log "Subject:            ", @prop("subject")
      console.log "Available Aliases:  ", @getAvailableAliases()
      console.log "Pending Requests:   ", @getPendingRequests()
      console.log "Completed Requests: ", @getCompletedRequests()
      debugger

      ## return the subject
      @prop("subject")