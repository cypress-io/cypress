do ($Cypress, _) ->

  $Cypress.Cy.extend
    _elMatchesCommandOptions: ($el, options) ->
      length = $el?.length

      switch
        when options.length isnt null
          if not _.isFinite(options.length)
            @throwErr("options.length must be a number", options.command)

          if length is options.length
            return $el

        when options.exist is false
          ## return if we didnt find anything and our options have asked
          ## us for the element not to exist
          if not length
            return null

        when options.visible is false
          ## make sure all the $el's are hidden
          if length and length is $el.filter(":hidden").length
            return $el

        when options.visible is true
          if length and length is $el.filter(":visible").length
            return $el

        else
          return $el if length

      return false