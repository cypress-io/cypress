$Cypress.register "Aliasing", (Cypress, _, $) ->

  blacklist = ["test", "runnable", "timeout", "slow", "skip", "inspect"]

  Cypress.Cy.extend
    _validateAlias: (alias) ->
      if not _.isString(alias)
        $Cypress.Utils.throwErrByPath "as.invalid_type"

      if _.isBlank(alias)
        $Cypress.Utils.throwErrByPath "as.empty_string"

      if alias in blacklist
        $Cypress.Utils.throwErrByPath "as.reserved_word", { args: { alias } }

    _addAlias: (aliasObj) ->
      {alias, subject} = aliasObj
      aliases = @prop("aliases") ? {}
      aliases[alias] = aliasObj
      @prop("aliases", aliases)

      remoteSubject = @getRemotejQueryInstance(subject)
      ## assign the subject to our runnable ctx
      @assign(alias, remoteSubject ? subject)

  Cypress.addUtilityCommand
    as: (subject, str) ->
      @ensureParent()
      @ensureSubject()

      @_validateAlias(str)

      ## this is the previous command
      ## which we are setting the alias as
      prev = @prop("current").get("prev")
      prev.set("alias", str)

      noLogFromPreviousCommandisAlreadyAliased = ->
        _.all prev.get("logs"), (log) ->
          log.get("alias") isnt str

      ## we also need to set the alias on the last command log
      ## that matches our chainerId
      if log = _.last(@commands.logs({
        instrument: "command"
        event: false
        chainerId: @prop("chainerId")
      }))

        ## make sure this alias hasn't already been applied
        ## to the previous command's logs by looping through
        ## all of its logs and making sure none of them are
        ## set to this alias
        if noLogFromPreviousCommandisAlreadyAliased()

          log.set({
            alias:     str
            aliasType: if $Cypress.Utils.hasElement(subject) then "dom" else "primitive"
          })

      @_addAlias({subject: subject, command: prev, alias: str})

      return subject
