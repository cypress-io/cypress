## attach to Eclectus global

class Base extends Eclectus.Command

Eclectus.Spy = do ($, _, Eclectus) ->

  class Spy extends Base
    config:
      type: "spy"

    initialize: ->
      @canBeParent = true

    log: (obj, method, spy) ->
      _this = @

      ## when the spy is invoked, emit that its been called
      spy.invoke = _(spy.invoke).wrap (orig, func, thisValue, args) ->
        error = null

        ## because our spy could potentially fail here
        ## we need to wrap this in a try / catch
        ## so we still emit the command that failed
        ## and the user can easily find the error
        try
          orig.call(@, func, thisValue, args)
        catch e
          error = e

        ## create a num property on our lastCall
        ## so we know which call # this is
        lastCall     = spy.lastCall
        lastCall.num = spy.callCount

        props =
          id:           _this.getId()
          method:       "call ##{lastCall.num}"
          message:      "#{args.length} arguments"
          spy:          spy
          spyCall:      lastCall
          parent:       _this.id
          canBeParent:  false

        props.error = "exception thrown" if error

        _this.emit props

        ## if an error did exist then we need
        ## to throw it right now
        throw(error) if error

      @emit
        method: "spy"
        message: method
        spy: spy

  return Spy

Eclectus.Stub = do ($, _, Eclectus) ->

  class Stub extends Eclectus.Command

    log: (obj, method, stub) ->
      _this = @

      ## when the stub is invoked, emit that its been called
      stub.invoke = _(stub.invoke).wrap (orig, func, thisValue, args) ->
        error = null
        returned = null

        ## because our stub could potentially fail here
        ## we need to wrap this in a try / catch
        ## so we still emit the command that failed
        ## and the user can easily find the error
        try
          returned = orig.call(@, func, thisValue, args)
        catch e
          error = e

        ## create a num property on our lastCall
        ## so we know which call # this is
        lastCall     = stub.lastCall
        lastCall.num = stub.callCount

        props =
          id:           _this.getId()
          method:       "call ##{lastCall.num}"
          message:      "returned #{returned}"
          stub:         stub
          stubCall:     lastCall
          parent:       _this.id
          canBeParent:  false

        props.error = "exception thrown" if error

        _this.emit props

        # if an error did exist then we need
        # to throw it right now
        throw(error) if error

      @emit
        method: "stub"
        message: method
        stub: stub

  return Stub

Eclectus.Mock = do ($, _, Eclectus) ->

  class Mock extends Eclectus.Command

  return Mock