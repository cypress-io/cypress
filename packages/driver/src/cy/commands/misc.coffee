_ = require("lodash")

$dom = require("../../dom")

module.exports = (Commands, Cypress, cy, state, config) ->
  Commands.addAll({ prevSubject: "optional" }, {
    end: ->
      null
  })

  Commands.addAll({
    noop: (arg) -> arg

    log: (msg, args) ->
      Cypress.log({
        end: true
        snapshot: true
        message: [msg, args]
        consoleProps: ->
          {
            message: msg
            args:    args
          }
      })

      return null

    wrap: (arg, options = {}) ->
      userOptions = options
      options = _.defaults({}, userOptions, { log: true })

      if options.log isnt false
        options._log = Cypress.log({
          message: arg
        })

        if $dom.isElement(arg)
          options._log.set({$el: arg})

      do resolveWrap = ->
        cy.verifyUpcomingAssertions(arg, options, {
          onRetry: resolveWrap
        })
        .return(arg)
  })
