$Cypress.register "Aliasing", (Cypress, _, $) ->

  blacklist = ["test", "runnable", "timeout", "slow", "skip", "inspect"]

  Cypress.on "defaults", ->
    @_aliases = {}

  Cypress.addChildCommand
    as: (subject, str) ->
      if not _.isString(str)
        @throwErr "cy.as() can only accept a string!"

      if _.isBlank(str)
        @throwErr "cy.as() cannot be passed an empty string!"

      if str in blacklist
        @throwErr "cy.as() cannot be aliased as: '#{str}'. This word is reserved."

      prev       = @prop("current").prev
      prev.alias = str

      @_aliases[str] = {subject: subject, command: prev, alias: str}

      ## assign the subject to our runnable ctx
      @assign(str, subject)

      # allAliases = _(@_aliases).keys().join(", ")

      # Cypress.command
      #   onConsole: ->
      #     "Alias": str
      #     "Returned": subject
      #     "Elements": subject.length
      #     "All Aliases": allAliases

      return subject