Cypress.Agents = do (Cypress, _) ->

  class Agents
    constructor: (@sandbox, @options) ->

    _getMessage: (method, args) ->
      method ?= "function"

      getArgs = ->
        calls = _.map args, (arg, i) -> "arg#{i + 1}"
        calls.join(", ")

      method + "(" + getArgs() + ")"

    _wrap: (type, agent, obj, method) ->
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
          name:      type
          message:   _this._getMessage(method, args)
          obj:       obj
          agent:     agent
          call:      agent.lastCall
          callCount: agent.callCount
          error:     error

        _this.options.onInvoke(props)

        ## if an error did exist then we need
        ## to bubble it up
        _this.options.onError(error) if error

        ## make sure we return the invoked return value
        ## of the spy
        return returned

    spy: (obj, method) ->
      spy = @sandbox.spy(obj, method)

      @_wrap("spy", spy, obj, method)

      @options.onCreate
        type: "spy"
        functionName: method

      return spy

    stub: (obj, method) ->
      stub = @sandbox.stub(obj, method)

      @_wrap("stub", stub, obj, method)

      @options.onCreate
        type: "spy"
        functionName: method

      return stub

    mock: ->

    useFakeTimers: ->

  Cypress.agents = (sandbox, options) ->
    new Agents(sandbox, options)

  return Agents