$Cypress.register "Aliasing", (Cypress, _, $) ->

  blacklist = ["test", "runnable", "timeout", "slow", "skip", "inspect"]

  Cypress.addUtilityCommand
    as: (subject, str) ->
      @ensureParent()
      @ensureSubject()

      aliases = @prop("aliases") ? {}

      if not _.isString(str)
        $Cypress.Utils.throwErrByPath "as.invalid_type"

      if _.isBlank(str)
        $Cypress.Utils.throwErrByPath "as.empty_string"

      if str in blacklist
        $Cypress.Utils.throwErrByPath "as.reserved_word", { args: { str } }

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

      aliases[str] = {subject: subject, command: prev, alias: str}

      @prop("aliases", aliases)

      remoteSubject = @getRemotejQueryInstance(subject)

      ## assign the subject to our runnable ctx
      @assign(str, remoteSubject ? subject)

      return subject
