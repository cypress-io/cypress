@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Test extends Entities.Model
    defaults: ->
      state: "pending"

    getResults: (test) ->
      @set state: test.state

  class Entities.TestsCollection extends Entities.Collection
    model: Entities.Test

    addTest: (test) ->
      @add
        title: test.title
        id: test.cid

  API =
    getNewTests: (tests) ->
      new Entities.TestsCollection tests

  App.reqres.setHandler "new:test:entities", (tests = []) ->
    API.getNewTests tests
