$Cypress.register "Agents", (Cypress, _, $, Promise) ->

  do (sinonAsPromised) ->
    sinonAsPromised(Promise)

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

  hasMatchingFake = (agent, args) ->
    _.some agent.fakes, (fake) ->
      fake.matches(args)

  getMessage = (method, args) ->
    method ?= "function"
    args = _.map args, (arg, i) -> "arg#{i + 1}"
    "#{method}(#{args.join(', ')})"

  onInvoke = (obj, args) ->
    if log = obj.log
      ## increment the callCount on the agent instrument log
      log.set "callCount", log.get("callCount") + 1
      alias = log.get("alias")

    agent = obj.agent

    if agent.fakes?.length and hasMatchingFake(agent, args)
      ## this is a parent fake and there is a matching child,
      ## let them log instead so there isn't a duplicate
      return

    if parent = agent.parent
      count = [parent._cyCount, obj.count].join("/")
    else
      count = obj.count

    aliases = _.compact([agent.parent?._cyAlias, alias])

    logProps = {
      name:     [obj.name, count].join("-")
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
        ## TODO: break out parent/child and show alias, what args match, etc
        if aliases.length
          aliasesLabel = "Alias"
          aliasesLabel += "es" if aliases.length > 1
          console[aliasesLabel] = aliases.join(", ")
        console[obj.name] = obj.agent
        console[display(obj.name)] = obj.obj
        console.Calls = obj.agent.callCount
        ## TODO: show this as key:value, not group
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

    if aliases.length
      logProps.alias = aliases
      logProps.aliasType = "agent"

    Cypress.Log.command(logProps)

  onError = (err) ->
    $Cypress.Utils.throwErr(err)

  wrap = (_cy, type, agent, obj, method) ->
    count = counts[type] += 1

    log = Cypress.Log.agent({
      name: [type, count].join("-")
      type: [type, count].join("-")
      functionName: method
      count: count
      callCount: 0
    })

    agent._cyCount = count

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
        message:   getMessage(method, args)
        obj:       obj
        agent:     agent
        call:      agent.lastCall
        callCount: agent.callCount
        error:     error
        log:       log

      onInvoke(props, args)

      ## if an error did exist then we need
      ## to bubble it up
      onError(error) if error

      ## make sure we return the invoked return value
      ## of the spy
      return returned

    agent.as = (alias) ->
      _cy._validateAlias(alias)
      _cy._addAlias({
        subject: agent
        command: log
        alias: alias
      })
      agent._cyAlias = alias
      log.set({
        alias: alias
        aliasType: "agent"
      })
      agent.named(alias)

    agent.withArgs = _.wrap agent.withArgs, (orig, args...) ->
      wrap(_cy, type, orig.apply(@, args), obj, method)

    return agent

  Cypress.Cy.extend
    spy: (obj, method) ->
      spy = @_getSandbox().spy(obj, method)
      wrap(@, "spy", spy, obj, method)

    stub: (obj, method, replacerFn) ->
      stub = @_getSandbox().stub(obj, method, replacerFn)
      wrap(@, "stub", stub, obj, method)

    agents: ->
      $Cypress.Utils.warning "cy.agents() is deprecated. Use cy.stub() and cy.spy() instead."

      {
        stub: @stub.bind(@)
        spy: @spy.bind(@)
      }
