$Cypress.register "Aliasing", (Cypress, _, $) ->

  Cypress.on "defaults", ->
    @_aliases = {}

  Cypress.addChildCommand
    as: (subject, str) ->
      prev       = @prop("current").prev
      prev.alias = str

      @_aliases[str] = {subject: subject, command: prev, alias: str}

      allAliases = _(@_aliases).keys().join(", ")

      # Cypress.command
      #   onConsole: ->
      #     "Alias": str
      #     "Returned": subject
      #     "Elements": subject.length
      #     "All Aliases": allAliases

      return subject

    ## this should now save the subject
    ## as a property on the runnable ctx
    assign: (subject, str) ->
      @throwErr "cy.assign() can only accept a string or number!" if not (_.isString(str) or _.isFinite(str))
      @throwErr "cy.assign() cannot be passed an empty argument!" if _.isBlank(str)

      @prop("runnable").ctx[str] = subject