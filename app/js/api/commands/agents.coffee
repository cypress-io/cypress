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
            error:   obj.error
            type:    "parent"
            onConsole: ->
              console = {}
              console.command = null
              console[obj.name] = obj.agent
              console[obj.name + " Obj"] = obj.obj
              console.calls = obj.calls
              # console.groups = [
              #   {
              #     name: "Call ##{obj.calls}",
              #     items: {
              #       Arguments: ""
              #       Context:   ""
              #       Returned:  ""
              #     }
              #   }
              # ]
              console

        onError: (err) =>
          @throwErr(err)
