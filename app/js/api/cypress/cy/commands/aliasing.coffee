$Cypress.register "Aliasing", (Cypress, _, $) ->

  blacklist = ["test", "runnable", "timeout", "slow", "skip", "inspect"]

  Cypress.addUtilityCommand
    as: (subject, str) ->
      @ensureParent()
      @ensureSubject()

      aliases = @prop("aliases") ? {}

      if not _.isString(str)
        @throwErr "cy.as() can only accept a string!"

      if _.isBlank(str)
        @throwErr "cy.as() cannot be passed an empty string!"

      if str in blacklist
        @throwErr "cy.as() cannot be aliased as: '#{str}'. This word is reserved."

      ## this is the previous command
      ## which we are setting the alias as
      prev = @prop("current").get("prev")
      prev.set("alias", str)

      ## we also need to set the alias on the last command log
      ## that matches our chainerId
      if log = _.last(@commands.logs({
        instrument: "command"
        event: false
        chainerId: @prop("chainerId")
      }))

        log.set({
          alias:     str
          aliasType: if $Cypress.Utils.hasElement(subject) then "dom" else "primitive"
        })

      aliases[str] = {subject: subject, command: prev, alias: str}

      @prop("aliases", aliases)

      ## assign the subject to our runnable ctx
      @assign(str, subject)

      return subject