do ($Cypress, _) ->

  $Cypress.Cy.extend

    ## we listen for the unload + submit events on
    ## the window, because when we receive them we
    ## tell cy its not ready and this prevents any
    ## additional invocations of any commands until
    ## its ready again (which happens after the load
    ## event)
    bindWindowListeners: (contentWindow) ->
      win = $(contentWindow)

      ## using the native submit method will not trigger a
      ## beforeunload event synchronously so we must bind
      ## to the submit event to know we're about to navigate away
      win.off("submit").on "submit", (e) =>
        ## if we've prevented the default submit action
        ## without stopping propagation, we will still
        ## receive this event even though the form
        ## did not submit
        return if e.isDefaultPrevented()

        ## null out our subject immediately
        ## to prevent chaining since our page is loading
        @nullSubject()

        @isReady(false, "submit")

      win.off("beforeunload").on "beforeunload", (e) =>
        ## bail if we've cancelled this event (from another source)
        ## or we've set a returnValue on the original event
        return if e.isDefaultPrevented() or @_eventHasReturnValue(e)

        @isReady(false, "beforeunload")

        @loading()

        @Cypress.Cookies.setInitial()

        @pageLoading()

        ## return undefined so our beforeunload handler
        ## doesnt trigger a confirmation dialog
        return undefined

      # win.off("unload").on "unload", =>
        ## put cy in a waiting state now that
        ## we've unloaded
        # @isReady(false, "unload")

      win.off("hashchange").on "hashchange", =>
        @urlChanged(null, {
          by: "hashchange"
        })

      win.get(0).confirm = (message) ->
        console.info "Confirming 'true' to: ", message
        return true