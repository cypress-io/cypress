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
      _.each ["options", "runnable", "subject"], (item) =>
        console.log "#{item}: ", (@prop(item) or @[item])
      console.log "Available Aliases: ", @_getAvailableAliases()
      debugger

      ## return the subject
      cy.prop("subject")