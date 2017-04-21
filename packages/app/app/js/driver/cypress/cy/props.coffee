do ($Cypress, _) ->

  $Cypress.Cy.extend

    prop: (key, val) ->
      if arguments.length is 1
        @props[key]
      else
        @props[key] = val

    private: (key, val) ->
      if arguments.length is 1
        @privates[key]
      else
        @privates[key] = val