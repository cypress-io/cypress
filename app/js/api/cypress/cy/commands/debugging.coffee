$Cypress.register "Debugging", (Cypress, _, $) ->

  Cypress.addDualCommand
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
      cy.prop("subject")