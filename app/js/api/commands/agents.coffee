do (Cypress, _) ->

  Cypress.extend
    agents: ->
      new Cypress.Agents @_getSandbox(),
        onCreate: (obj) =>
          Cypress.agent(obj)

        onInvoke: (obj) =>
          Cypress.command
            name:    obj.name
            message: obj.message
            type:    "parent"
            onConsole: ->

        onError: =>

