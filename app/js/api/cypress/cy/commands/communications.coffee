$Cypress.register "Communications", (Cypress, _, $) ->

  Cypress.addParentCommand
    msg: ->
      @sync.message.apply(@, arguments)

    message: (msg, data) ->
      ## should we increase the command timeout here to 10s?

      new Promise (resolve, reject) =>

        command = Cypress.command
          name: "msg"
          message: [msg, data]

        Cypress.trigger "message", msg, data, (response) =>
          if err = response.__error
            try
              @throwErr(err, command)
            catch e
              reject(e)
          else
            command.set
              onConsole: -> {
                Message: command.get("message")
                Returned: response
              }

            command.snapshot().end()
            resolve(response)