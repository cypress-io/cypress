$Cypress.register "Debugging", (Cypress, _, $) ->

  Cypress.on "resume:next", ->
    @resume(false)

  Cypress.on "resume:all", ->
    @resume()

  Cypress.on "pause", ->
    ## continue chaining off the current chain
    if chain = @prop("chain")
      chain.pause()
    else
      @pause()

  Cypress.Cy.extend
    resume: (resumeAll = true) ->
      onResume = @prop("onResume")

      ## dont do anything if this isnt a fn
      return if not _.isFunction(onResume)

      ## nuke this out so it can only
      ## be called a maximum of 1 time
      @prop("onResume", null)

      ## call the fn
      onResume.call(@, resumeAll)

    getNextQueuedCommand: ->
      ## gets the next command which
      ## isnt skipped
      search = (i) =>
        cmd = @commands.at(i)

        if cmd and cmd.get("skip")
          search(i + 1)
        else
          return cmd

      search(@prop("index"))

  Cypress.addUtilityCommand
    ## pause should indefinitely pause until the user
    ## presses a key or clicks in the UI to continue
    pause: (options = {}) ->
      ## bail if we're headless
      return @prop("subject") if $Cypress.isHeadless

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
        next = @getNextQueuedCommand()

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

    debug: (options = {}) ->
      _.defaults options, {log: true}

      if options.log
        options._log = Cypress.Log.command({
          snapshot: true
          end: true
        })

      previous = @prop("current").get("prev")

      ###
      cy.debug provides the previous command and the current subject below:
      ###

      console.log "\n%c------------------------Cypress Debug Info------------------------", "font-weight: bold;"
      console.log "Previous Command Name: ", previous and previous.get("name")
      console.log "Previous Command Args: ", previous and previous.get("args")
      console.log "Current Subject:       ", @prop("subject")
      debugger

      ## return the subject
      @prop("subject")
