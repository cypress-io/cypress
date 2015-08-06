@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Stats extends Entities.Model
    defaults: ->
      failed:   0
      passed:   0
      pending:  0
      duration: 0

    reset: ->
      @clear silent: true
      @set _.result(@, "defaults")

    ## sets the result of all of the tests
    ## globally so they're accessible from
    ## sauce labs or nullify them
    setGlobally: (bool = true) ->
      window.cypressResults = if bool then @attributes else null

    startCounting: ->
      ## bail if we've already started counting!
      return if @get("start")

      @set "start", Date.now()

      # @stopCounting() if @intervalId
      # @intervalId = setInterval _.bind(@increment, @, "duration"), 100

    stopCounting: ->
      @set "end", Date.now()
      # clearInterval @intervalId

    setDuration: ->
      @set "duration", new Date - @get("start")

    increment: (state) ->
      @set state, @get(state) + 1

    countTestState: (test) ->
      @increment test.get("state")

    ## should be using a mutator here
    getDurationFormatted: ->
      (@get("duration") / 1000).toFixed(2)

  App.reqres.setHandler "stats:entity", ->
    new Entities.Stats