$Cypress.register "Communications", (Cypress, _, $, Promise) ->

  Cypress.addParentCommand
    msg: ->
      @sync.message.apply(@, arguments)

    message: (msg, data, options = {}) ->
      _.defaults options, {log: true}

      ## should we increase the command timeout here to 10s?

      new Promise (resolve, reject) =>

        if options.log isnt false
          options._log = Cypress.Log.command
            name: "message"
            message: Cypress.Utils.stringify([msg, data])

        Cypress.trigger "message", msg, data, (response) =>
          if err = response.__error
            try
              @throwErr(err, options._log)
            catch e
              e.__isMessage = true
              e.name = response.__name if response.__name
              e.stack = response.__stack if response.__stack
              reject(e)
          else
            if options._log
              options._log.set
                onConsole: -> {
                  Message: msg
                  "Data Sent": data
                  "Data Returned": response
                }

              options._log.snapshot()

            resolve(response)