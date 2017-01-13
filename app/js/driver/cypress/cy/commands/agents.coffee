$Cypress.register "Agents", (Cypress, _, $) ->

  display = (name) ->
    switch name
      when "spy"  then "Spied Obj"
      when "stub" then "Stubbed Obj"
      when "mock" then "Mocked Obj"

  Cypress.Cy.extend
    stub: (obj, method, replacerFn) ->
      stub = @_getSandbox().stub(obj, method, replacerFn)
      log = @_onCreate("stub", method)
      @_wrap("stub", stub, obj, method, log)

    _onCreate: (type, method) ->
      Cypress.Log.agent({
        type: type
        functionName: method
        callCount: 0
      })

    _wrap: (type, agent, obj, method, log) ->
      _this = @

      agent.invoke = _.wrap agent.invoke, (orig, func, thisValue, args) ->
        error = null
        returned = null

        ## because our spy could potentially fail here
        ## we need to wrap this in a try / catch
        ## so we still emit the command that failed
        ## and the user can easily find the error
        try
          returned = orig.call(@, func, thisValue, args)
        catch e
          error = e

        props =
          ## QUESTION: is this necessary?
          # count:     agent._cy
          name:      type
          message:   _this._getMessage(method, args)
          obj:       obj
          agent:     agent
          call:      agent.lastCall
          callCount: agent.callCount
          error:     error
          log:       log

        _this._onInvoke(props)

        ## if an error did exist then we need
        ## to bubble it up
        _this._onError(error) if error

        ## make sure we return the invoked return value
        ## of the spy
        return returned

      return agent

    _getMessage: (method, args) ->
      method ?= "function"

      getArgs = ->
        calls = _.map args, (arg, i) -> "arg#{i + 1}"
        calls.join(", ")

      method + "(" + getArgs() + ")"

    _onInvoke: (obj) ->
      if log = obj.log
        ## increment the callCount on the agent instrument log
        log.set "callCount", log.get("callCount") + 1

      name = if obj.count?
        [obj.name, obj.count].join("-")
      else
        obj.name

      Cypress.Log.command
        name:     name
        message:  obj.message
        error:    obj.error
        type:     "parent"
        end:      true
        snapshot: true
        event:    true
        consoleProps: ->
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

    _onError: (err) =>
      $Cypress.Utils.throwErr(err)

    agents: ->
      Cypress.Agents.create @_getSandbox(),
        onCreate: (obj) =>
          obj.type = [obj.type, obj.count].join("-")
          obj.callCount = 0
          Cypress.Log.agent(obj)

        onInvoke: @_onInvoke.bind(@)

        onError: @_onError.bind(@)
