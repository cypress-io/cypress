$Cypress.register "Communications", (Cypress, _, $, Promise) ->

  Cypress.addParentCommand
    msg: ->
      @sync.message.apply(@, arguments)

    message: (msg, data, options = {}) ->
      ## should we increase the command timeout here to 10s?

      _.defaults options,
        log: true

      new Promise (resolve, reject) =>

        if options.log
          command = Cypress.Log.command
            name: "message"
            message: Cypress.Utils.stringify([msg, data])

        Cypress.trigger "message", msg, data, (response) =>
          if err = response.__error
            try
              @throwErr(err, command)
            catch e
              e.__isMessage = true
              e.name = response.__name if response.__name
              e.stack = response.__stack if response.__stack
              reject(e)
          else
            if command
              command.set
                onConsole: -> {
                  Message: msg
                  "Data Sent": data
                  "Data Returned": response
                }

              command.snapshot().end()

            resolve(response)