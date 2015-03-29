Cypress.Runner = do (Cypress, _) ->

  Cypress.on "fail", (err) ->
    Cypress.getRunner().fail(err)

  Cypress.on "abort", ->
    Cypress.getRunner().abort()

  Cypress.on "destroy", ->
    Cypress.getRunner().destroy()
    Cypress._runner = null

  class Runner
    constructor: (@runner) ->

    fail: (err) ->
      @runner.uncaught(err)

    destroy: ->
      ## stop listening here to all events?

    abort: ->
      @runner.abort()

    override: ->
      @_abort = @abort
      @abort = ->
      @

    restore: ->
      if @_abort
        @abort = @_abort
      @

    @create = (runner) ->
      Cypress._runner = new Runner(runner)

  Cypress.getRunner = ->
    @_runner ? throw new Error("Cypress._runner instance not found!")

  return Runner