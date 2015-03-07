do (Cypress, _) ->

  Cypress.extend
    agents: ->
      new Cypress.Agents @_getSandbox(),
        onInvoke: (obj) =>
          Cypress.command
            name:    obj.name
            message: obj.message
            type:    "parent"
            onConsole: ->

        onError: =>

