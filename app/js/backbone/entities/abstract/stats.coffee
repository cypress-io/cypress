@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Stats extends Entities.Model
    defaults: ->
      failed:   0
      passed:   0
      pending:  0
      duration: 0

    startCounting: ->
      @stopCounting() if @intervalId
      @intervalId = setInterval _.bind(@increment, @, "duration"), 100

    stopCounting: ->
      clearInterval @intervalId

    increment: (state) ->
      @set state, @get(state) + 1

    countTestState: (test) ->
      @increment test.state

    ## should be using a mutator here
    getDurationFormatted: ->
      duration = @get("duration")
      (duration / 10)

  App.reqres.setHandler "stats:entity", ->
    new Entities.Stats