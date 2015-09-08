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

        Cypress.trigger "message", msg, data, (resp) =>
          if err = resp.__error
            try
              @throwErr(err, command)
            catch e
              e.__isMessage = true
              e.name = resp.__name if resp.__name
              e.stack = resp.__stack if resp.__stack
              reject(e)
          else
            if command
              command.set
                onConsole: -> {
                  Message: msg
                  "Data Sent": data
                  "Data Returned": resp.response
                  "Logs": resp.__logs
                }

              command.snapshot().end()

            resolve(resp.response)