@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Stats extends Entities.Model
    defaults: ->
      failed:   0
      passed:   0
      pending:  0
      duration: 0
      paused:   false
      running:  false
      started:  null
      ended:    null

    reset: ->
      @clear silent: true
      @set _.result(@, "defaults")

    running: ->
      @set "running", true

    ## sets the result of all of the tests
    ## globally so they're accessible from
    ## sauce labs or nullify them
    setGlobally: (bool = true) ->
      window.cypressResults = if bool then @attributes else null

    startCounting: ->
      ## bail if we've already started counting!
      return if @get("started")

      @set "started", Date.now()

      # @stopCounting() if @intervalId
      # @intervalId = setInterval _.bind(@increment, @, "duration"), 100

    end: ->
      @set({
        ended: Date.now()
        running: false
        paused: false
      })

    setDuration: ->
      @set "duration", new Date - @get("started")

    increment: (state) ->
      @set state, @get(state) + 1

    countTestState: (test) ->
      @increment test.get("state")

    ## should be using a mutator here
    getDurationFormatted: ->
      (@get("duration") / 1000).toFixed(2)

    pause: ->
      @set("disablePause", true)

    resume: ->
      @unset("nextCmd")
      @unset("paused")
      @trigger("pause:mode")

    disableNext: ->
      @set("disableNext", true)

    paused: (nextCmd) ->
      @set({nextCmd: nextCmd, disableNext: false, disablePause: false, paused: true})
      @trigger("pause:mode")

  App.reqres.setHandler "stats:entity", ->
    new Entities.Stats