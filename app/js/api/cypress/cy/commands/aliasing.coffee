$Cypress.register "Aliasing", (Cypress, _, $) ->

  blacklist = ["test", "runnable", "timeout", "slow", "skip", "inspect"]

  Cypress.addChildCommand
    as: (subject, str) ->
      aliases = @prop("aliases") ? {}

      if not _.isString(str)
        @throwErr "cy.as() can only accept a string!"

      if _.isBlank(str)
        @throwErr "cy.as() cannot be passed an empty string!"

      if str in blacklist
        @throwErr "cy.as() cannot be aliased as: '#{str}'. This word is reserved."

      prev       = @prop("current").prev
      prev.alias = str

      aliases[str] = {subject: subject, command: prev, alias: str}

      @prop("aliases", aliases)

      ## assign the subject to our runnable ctx
      @assign(str, subject)

      # allAliases = _(@_aliases).keys().join(", ")

      # Cypress.Log.command
      #   onConsole: ->
      #     "Alias": str
      #     "Returned": subject
      #     "Elements": subject.length
      #     "All Aliases": allAliases

      return subject