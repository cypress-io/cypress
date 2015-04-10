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

    wrap: (obj) ->
      options =
        end: true
        snapshot: true

      options.$el = obj if $Cypress.Utils.hasElement(obj)

      Cypress.command(options)

      obj