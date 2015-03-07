Cypress.Agents = do (Cypress, _) ->

  # fnRe = /function (.{1,})\(/

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

        ## create a num property on our lastCall
        ## so we know which call # this is
        lastCall     = agent.lastCall
        lastCall.num = agent.callCount

        props =
          name:     type
          message:  _this._getMessage(method, args)
          agent:    agent
          obj:      obj
          call:     lastCall
          error:    error

        _this.options.onInvoke(props)

        ## if an error did exist then we need
        ## to bubble it up
        _this.options.onError(error) if error

        ## make sure we return the invoked return value
        ## of the spy
        return returned

    # _getClassName: (obj) ->
    #   return "" if not obj?

    #   results = fnRe.exec obj.constructor.toString()
    #   (results and results[1]) or ""

    spy: (obj, method) ->
      spy = @sandbox.spy(obj, method)

      @_wrap("spy", spy, obj, method)

      @options.onCreate
        type: "spy"
        # className: @_getClassName(obj)
        functionName: method

      return spy

    stub: (obj, method) ->
      stub = @sandbox.stub(obj, method)

      @_wrap("stub", stub, obj, method)

      return stub

    mock: ->

    useFakeTimers: ->

  Cypress.agents = (sandbox, options) ->
    new Agents(sandbox, options)

  return Agents