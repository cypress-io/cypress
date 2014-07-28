@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Test extends Entities.Model
    defaults: ->
      state: "processing"

    initialize: ->
      new Backbone.Chooser(@)

    ## did our test take a long time to run?
    isSlow: ->
      @get("duration") > @_slow

    timedOut: ->
      @get("duration") > @_timeout

    getResults: (test) ->
    removeOriginalError: ->
      delete @originalError
    setResults: (test) ->
      ## dont use underscore pick here because we'll most likely
      ## have to do some property translation from other frameworks

      ## we have to normalize the state by first looking at whether
      ## its pending (because then it wont have a state)
      attrs =
        state:    if test.pending then "pending" else test.state
        duration: test.duration

      if test.err
        ## output the error to the console to receive stack trace
        console.error(test.err)

        ## backup the original error to output to the console
        @originalError = test.err

        ## set the err on the attrs
        attrs.error = test.err.stack or test.err.toString()
      else
        ## remove the original error in case it exists
        @removeOriginalError()

        ## reset the error attribute to null so we remove any
        ## existing error message
        attrs.error = null

      ## set the private _slow and _timeout
      ## based on the result of these methods
      @_slow = test.slow()
      @_timeout = test.timeout()

      @set attrs

  class Entities.TestsCollection extends Entities.Collection
    model: Entities.Test

    addTest: (test) ->
      @add
        title: test.originalTitle()
        id: test.cid

    initialize: ->
      new Backbone.SingleChooser(@)

  API =
    getNewTests: (tests) ->
      new Entities.TestsCollection tests

  App.reqres.setHandler "new:test:entities", (tests = []) ->
    API.getNewTests tests
