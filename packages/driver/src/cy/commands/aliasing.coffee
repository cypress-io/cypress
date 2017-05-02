_ = require("lodash")

$Cy = require("../../cypress/cy")
utils = require("../../cypress/utils")

blacklist = ["test", "runnable", "timeout", "slow", "skip", "inspect"]

$Cy.extend({
  _validateAlias: (alias) ->
    if not _.isString(alias)
      utils.throwErrByPath "as.invalid_type"

    if _.isBlank(alias)
      utils.throwErrByPath "as.empty_string"

    if alias in blacklist
      utils.throwErrByPath "as.reserved_word", { args: { alias } }

  _addAlias: (aliasObj) ->
    {alias, subject} = aliasObj
    aliases = @state("aliases") ? {}
    aliases[alias] = aliasObj
    @state("aliases", aliases)

    remoteSubject = @_getRemotejQueryInstance(subject)
    ## assign the subject to our runnable ctx
    @assign(alias, remoteSubject ? subject)
})

module.exports = (Cypress, Commands) ->
  Commands.addUtility({
    as: (subject, str) ->
      @ensureParent()
      @ensureSubject()

      @_validateAlias(str)

      ## this is the previous command
      ## which we are setting the alias as
      prev = @state("current").get("prev")
      prev.set("alias", str)

      noLogFromPreviousCommandisAlreadyAliased = ->
        _.every prev.get("logs"), (log) ->
          log.get("alias") isnt str

      ## we also need to set the alias on the last command log
      ## that matches our chainerId
      if log = _.last(@queue.logs({
        instrument: "command"
        event: false
        chainerId: @state("chainerId")
      }))

        ## make sure this alias hasn't already been applied
        ## to the previous command's logs by looping through
        ## all of its logs and making sure none of them are
        ## set to this alias
        if noLogFromPreviousCommandisAlreadyAliased()

          log.set({
            alias:     str
            aliasType: if utils.hasElement(subject) then "dom" else "primitive"
          })

      @_addAlias({subject: subject, command: prev, alias: str})

      return subject
  })
