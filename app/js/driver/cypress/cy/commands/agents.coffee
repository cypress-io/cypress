$Cypress.register "Agents", (Cypress, _, $) ->

  display = (name) ->
    switch name
      when "spy"  then "Spied Obj"
      when "stub" then "Stubbed Obj"

  counts = null

  resetCounts = ->
    counts = {
      spy: 0
      stub: 0
    }

  resetCounts()
  Cypress.on "restore", resetCounts

  Cypress.Cy.extend
    spy: (obj, method) ->
      spy = @_getSandbox().spy(obj, method)
      @_wrap("spy", spy, obj, method)

    stub: (obj, method, replacerFn) ->
      stub = @_getSandbox().stub(obj, method, replacerFn)
      @_wrap("stub", stub, obj, method)

    _wrap: (type, agent, obj, method) ->
      _this = @

      count = counts[type] += 1

      log = Cypress.Log.agent({
        name: [type, count].join("-")
        type: type
        functionName: method
        count: count
        callCount: 0
      })

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
          count:     count
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

      agent.as = (alias) ->
        log.set({
          alias: alias
          aliasType: "agent"
        })
        return agent

      return agent

    _getMessage: (method, args) ->
      method ?= "function"
      args = _.map args, (arg, i) -> "arg#{i + 1}"
      "#{method}(#{args.join(', ')})"

    _onInvoke: (obj) ->
      if log = obj.log
        ## increment the callCount on the agent instrument log
        log.set "callCount", log.get("callCount") + 1
        alias = log.get("alias")

      logProps = {
        name:     [obj.name, obj.count].join("-")
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
          console.Alias = alias
          console[obj.name] = obj.agent
          console[display(obj.name)] = obj.obj
          console.Calls = obj.agent.callCount
          console.groups = ->
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
      }

      if alias
        logProps.alias = alias
        logProps.aliasType = "agent"

      Cypress.Log.command(logProps)

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
