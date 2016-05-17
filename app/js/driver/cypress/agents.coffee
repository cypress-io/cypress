$Cypress.Agents = do ($Cypress, _) ->

  class $Agents
    constructor: (@sandbox, @options) ->
      @count = 0

    _getMessage: (method, args) ->
      method ?= "function"

      getArgs = ->
        calls = _.map args, (arg, i) -> "arg#{i + 1}"
        calls.join(", ")

      method + "(" + getArgs() + ")"

    _wrap: (type, agent, obj, method, log) ->
      _this = @

      agent._cy = _this.count

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
          count:     agent._cy
          name:      type
          message:   _this._getMessage(method, args)
          obj:       obj
          agent:     agent
          call:      agent.lastCall
          callCount: agent.callCount
          error:     error
          log:       log

        _this.options.onInvoke(props)

        ## if an error did exist then we need
        ## to bubble it up
        _this.options.onError(error) if error

        ## make sure we return the invoked return value
        ## of the spy
        return returned

    spy: (obj, method) ->
      spy = @sandbox.spy(obj, method)

      log = @options.onCreate
        type: "spy"
        functionName: method
        count: @count += 1

      @_wrap("spy", spy, obj, method, log)

      return spy

    stub: (obj, method) ->
      stub = @sandbox.stub(obj, method)

      log = @options.onCreate
        type: "stub"
        functionName: method
        count: @count += 1

      @_wrap("stub", stub, obj, method, log)

      return stub

    mock: ->
      $Cypress.Utils.throwErrByPath("miscellaneous.method_not_implemented", {
        args: { method: "$Agents#mock" }
      })

    useFakeTimers: ->

    @create = (sandbox, options) ->
      new $Agents(sandbox, options)

  return $Agents
