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
        orig.call(@, func, thisValue, args)

        ## create a num property on our lastCall
        ## so we know which call # this is
        lastCall     = spy.lastCall
        lastCall.num = spy.callCount

        _this.emit
          id:           _this.getId()
          method:       "call ##{lastCall.num}"
          message:      "#{args.length} arguments"
          spy:          spy
          spyCall:      lastCall
          parent:       _this.id
          canBeParent:  false

      @emit
        method: "spy"
        message: method
        spy: spy

  return Spy

Eclectus.Stub = do ($, _, Eclectus) ->

  class Stub extends Eclectus.Command

  return Stub

Eclectus.Mock = do ($, _, Eclectus) ->

  class Mock extends Eclectus.Command

  return Mock