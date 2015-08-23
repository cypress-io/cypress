do ($Cypress, _) ->

  previousWin = null

  $Cypress.Cy.extend

    offWindowListeners: ->
      if previousWin
        previousWin.off()
        previousWin = null

    offIframeListeners: ($remoteIframe) ->
      $remoteIframe?.off()

    ## we listen for the unload + submit events on
    ## the window, because when we receive them we
    ## tell cy its not ready and this prevents any
    ## additional invocations of any commands until
    ## its ready again (which happens after the load
    ## event)
    bindWindowListeners: (contentWindow) ->
      @offWindowListeners()

      return if contentWindow.location.href is "about:blank"

      win = $(contentWindow)

      previousWin = win

      ## using the native submit method will not trigger a
      ## beforeunload event synchronously so we must bind
      ## to the submit event to know we're about to navigate away
      win.on "submit", (e) =>
        ## if we've prevented the default submit action
        ## without stopping propagation, we will still
        ## receive this event even though the form
        ## did not submit
        return if e.isDefaultPrevented()

        @submitting(e)

        @isReady(false, "submit")

      win.on "beforeunload", (e) =>
        ## bail if we've cancelled this event (from another source)
        ## or we've set a returnValue on the original event
        return if e.isDefaultPrevented() or @_eventHasReturnValue(e)

        @isReady(false, "beforeunload")

        @loading()

        @Cypress.Cookies.setInitial()

        @pageLoading()

        ## whenever our window is about to be nuked
        ## we want to turn off all of the window listeners
        ## else jquery will never release them
        @offWindowListeners()

        ## return undefined so our beforeunload handler
        ## doesnt trigger a confirmation dialog
        return undefined

      # win.off("unload").on "unload", =>
        ## put cy in a waiting state now that
        ## we've unloaded
        # @isReady(false, "unload")

      win.on "hashchange", =>
        @urlChanged(null, {
          by: "hashchange"
        })

      win.get(0).confirm = (message) ->
        console.info "Confirming 'true' to: ", message
        return true