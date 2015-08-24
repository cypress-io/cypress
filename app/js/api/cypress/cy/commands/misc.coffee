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

    wrap: (obj, options = {}) ->
      _.defaults options, {log: true}

      if options.log
        command = Cypress.Log.command()

        if Cypress.Utils.hasElement(obj)
          command.set({$el: obj})

        command.snapshot()

      return {subject: obj, command: command}