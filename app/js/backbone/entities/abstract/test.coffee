@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Test extends Entities.Model
    defaults: ->
      state: "pending"

    initialize: ->
      new Backbone.Chooser(@)

    getResults: (test) ->
      attrs = {state: test.state}

      if test.err
        ## output the error to the console to receive stack trace
        console.error(test.err)

        ## backup the original error to output to the console
        @originalError = test.err

        ## set the err on the attrs
        attrs.error = test.err.stack or test.err.toString()

      @set attrs

  class Entities.TestsCollection extends Entities.Collection
    model: Entities.Test

    addTest: (test) ->
      @add
        title: test.title
        id: test.cid

    initialize: ->
      new Backbone.SingleChooser(@)

  API =
    getNewTests: (tests) ->
      new Entities.TestsCollection tests

  App.reqres.setHandler "new:test:entities", (tests = []) ->
    API.getNewTests tests
