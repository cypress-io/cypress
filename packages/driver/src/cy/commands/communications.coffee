_ = require("lodash")
Promise = require("bluebird")

$Cy = require("../../cypress/cy")
$Log = require("../../cypress/log")
utils = require("../../cypress/utils")

module.exports = (Cypress, Commands) ->
  message = (msg, data, options = {}) ->
    throw new Error("method not yet implemented")

    ## accept {retry: true} here which will verify
    ## upcoming assertions and replay the msg?
    ## or make this the default and force users
    ## to only turn OFF this behavior

    _.defaults options, {log: true}

    ## should we increase the command timeout here to 10s?

    ## TODO:
    ## NEED TO ADD TIMEOUT HANDLING TO THESE COMMANDS
    ## REFER TO OTHER COMMANDS SUCH AS CY.COOKIES,
    ## CY.EXEC, CY.REQUEST FOR IMPLEMENTATION DETAILS

    _.defaults options,
      log: true

    new Promise (resolve, reject) =>

      if options.log isnt false
        options._log = $Log.command
          name: "message"
          message: utils.stringify([msg, data])

      Cypress.trigger "message", msg, data, (resp) =>
        if err = resp.__error
          try
            utils.throwErr(err, { onFail: options._log })
          catch e
            e.__isMessage = true
            e.name = resp.__name if resp.__name
            e.stack = resp.__stack if resp.__stack
            reject(e)
        else
          if options._log
            options._log.set
              consoleProps: -> {
                Message: msg
                "Data Sent": data
                "Data Returned": resp.response
                "Logs": resp.__logs
              }

            options._log.snapshot()

          resolve(resp.response)

  Commands.addAll({
    msg: ->
      message.apply(@, arguments)

    message: ->
      message.apply(@, arguments)
  })
