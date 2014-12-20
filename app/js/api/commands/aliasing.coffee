do (Cypress, _) ->

  Cypress.add

    as: (str) ->
      ## make sure the prev object is NOT a modifier

      ## throwErr if prev object is a modifier
      ## throwErr if prev object is undefined
      @_aliases[str] = @prop("current").prev

      return @_subject()