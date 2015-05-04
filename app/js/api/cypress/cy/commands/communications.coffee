$Cypress.register "Communications", (Cypress, _, $) ->

  Cypress.addParentCommand
    msg: ->
      @sync.message.apply(@, arguments)

    message: ->