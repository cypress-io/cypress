$Cypress.register "Agents", (Cypress, _, $) ->

  display = (name) ->
    switch name
      when "spy"  then "Spied Obj"
      when "stub" then "Stubbed Obj"
      when "mock" then "Mocked Obj"

  Cypress.Cy.extend
    agents: ->
      Cypress.Agents.create @_getSandbox(),
        onCreate: (obj) =>
          obj.type = [obj.type, obj.count].join("-")
          obj.callCount = 0
          Cypress.agent(obj)

        onInvoke: (obj) =>
          if log = obj.log
            ## increment the callCount on the agent instrument log
            log.set "callCount", log.get("callCount") + 1

          Cypress.command
            name:    [obj.name, obj.count].join("-")
            message: obj.message
            error:   obj.error
            type:    "parent"
            end:     true
            snapshot: true
            onConsole: ->
              console = {}
              console.Command = null
              console.Error = null
              console[obj.name] = obj.agent
              console[display(obj.name)] = obj.obj
              console.Calls = obj.agent.callCount
              console.groups = ->
                ## dont show any groups if we dont
                ## have any calls
                return if obj.callCount is 0

                items = {
                  Arguments: obj.call.args
                  Context:   obj.call.thisValue
                  Returned:  obj.call.returnValue
                }

                items.Error = obj.error.stack if obj.error

                [
                  {
                    name: "Call ##{obj.callCount}:",
                    items: items
                  }
                ]
              console

        onError: (err) =>
          @throwErr(err)
