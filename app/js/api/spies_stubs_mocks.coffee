## attach to Eclectus global

class Base extends Eclectus.Command

Eclectus.Spy = do ($, _, Eclectus) ->

  class Spy extends Base
    config:
      type: "spy"

    initialize: ->
      @canBeParent = true

    log: (obj, method, spy) ->
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