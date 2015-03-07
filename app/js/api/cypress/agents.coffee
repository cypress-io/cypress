Cypress.Agents = do (Cypress, _) ->

  class Agents
    constructor: (@sandbox, @options) ->

    getMessage: (obj, method, args) ->
      method ?= "spy"

      getArgs = ->
        calls = _.map args, (arg, i) -> "arg#{i + 1}"
        calls.join(", ")

      method + "(" + getArgs() + ")"

    _wrap: (type, obj, method) ->
      _this = @

      obj.invoke = _.wrap obj.invoke, (orig, func, thisValue, args) ->
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
        lastCall     = obj.lastCall
        lastCall.num = obj.callCount

        props =
          name:     type
          message:  _this.getMessage(obj, method, args)
          # id:           _this.getId()
          # method:       "call ##{lastCall.num}"
          # message:      "#{args.length} arguments"
          # spy:          obj
          # spyCall:      lastCall
          # spyObj:       obj
          # parent:       _this.id
          # canBeParent:  false

        props.error = "exception thrown" if error

        _this.options.onInvoke(props)

        # _this.emit props

        ## if an error did exist then we need
        ## to throw it right now
        # throw(error) if error

        ## make sure we return the invoked return value
        ## of the spy
        return returned

    spy: (obj, method) ->
      spy = @sandbox.spy(obj, method)

      @_wrap("spy", spy, method)

      return spy

    stub: (obj, method) ->
      stub = @sandbox.stub(obj, method)

      @_wrap("stub", stub)

      return stub

    mock: ->

    useFakeTimers: ->

  Cypress.agents = (sandbox, options) ->
    new Agents(sandbox, options)

  return Agents