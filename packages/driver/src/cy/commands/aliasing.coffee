_ = require("lodash")

$utils = require("../../cypress/utils")

module.exports = (Commands, Cypress, cy, state, config) ->
  Commands.addUtility({
    as: (subject, str) ->
      cy.ensureParent()
      cy.ensureSubject()

      cy.validateAlias(str)

      ## this is the previous command
      ## which we are setting the alias as
      prev = state("current").get("prev")
      prev.set("alias", str)

      noLogFromPreviousCommandisAlreadyAliased = ->
        _.every prev.get("logs"), (log) ->
          log.get("alias") isnt str

      ## we also need to set the alias on the last command log
      ## that matches our chainerId
      if log = _.last(cy.queue.logs({
        instrument: "command"
        event: false
        chainerId: state("chainerId")
      }))

        ## make sure this alias hasn't already been applied
        ## to the previous command's logs by looping through
        ## all of its logs and making sure none of them are
        ## set to this alias
        if noLogFromPreviousCommandisAlreadyAliased()

          log.set({
            alias:     str
            aliasType: if $utils.hasElement(subject) then "dom" else "primitive"
          })

      cy.addAlias({subject: subject, command: prev, alias: str})

      return subject
  })
