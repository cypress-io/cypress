do (Cypress, _) ->

  Cypress.addChildCommand

    ## this should now save the subject
    ## as a property on the runnable ctx
    assign: (subject, str) ->
      @throwErr "cy.assign() can only accept a string or number!" if not (_.isString(str) or _.isFinite(str))
      @throwErr "cy.assign() cannot be passed an empty argument!" if _.isBlank(str)

      @prop("runnable").ctx[str] = subject