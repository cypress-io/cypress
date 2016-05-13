$Cypress.register "Communications", (Cypress, _, $, Promise) ->

  Cypress.addParentCommand
    msg: ->
      @sync.message.apply(@, arguments)

    message: (msg, data, options = {}) ->
      ## accept {retry: true} here which will verify
      ## upcoming assertions and replay the msg?
      ## or make this the default and force users
      ## to only turn OFF this behavior

      _.defaults options, {log: true}

      ## should we increase the command timeout here to 10s?

      _.defaults options,
        log: true

      new Promise (resolve, reject) =>

        if options.log isnt false
          options._log = Cypress.Log.command
            name: "message"
            message: Cypress.Utils.stringify([msg, data])

        Cypress.trigger "message", msg, data, (resp) =>
          if err = resp.__error
            try
              $Cypress.Utils.throwErr(err, { onFail: options._log })
            catch e
              e.__isMessage = true
              e.name = resp.__name if resp.__name
              e.stack = resp.__stack if resp.__stack
              reject(e)
          else
            if options._log
              options._log.set
                onConsole: -> {
                  Message: msg
                  "Data Sent": data
                  "Data Returned": resp.response
                  "Logs": resp.__logs
                }

              options._log.snapshot()

            resolve(resp.response)
