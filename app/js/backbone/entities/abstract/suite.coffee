@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Suite extends Entities.Model
    defaults: ->
      state: "processing"

    initialize: ->
      new Backbone.Chooser(@)

    addTest: (test) ->
      @get("tests").addTest(test)

    getTest: (test) ->
      @get("tests").get(test.cid)

    anyAreProcessing: (states) ->
      _(states).any (state) -> state is "processing"

    anyAreFailed: (states) ->
      _(states).any (state) -> state is "failed"

    allArePassed: (states) ->
      _(states).all (state) -> state is "passed"

    updateState: ->
      ## grab all of the states of the tests
      states = @get("tests").pluck("state")

      state = switch
        when @anyAreProcessing(states) then "processing"
        when @anyAreFailed(states) then "failed"
        when @allArePassed(states) then "passed"

      @set state: state

    unchooseTests: ->
      @get("tests").invoke "unchoose"

  class Entities.SuitesCollection extends Entities.Collection
    model: Entities.Suite

    initialize: ->
      new Backbone.SingleChooser(@)

    addSuite: (suite) ->
      @add
        title: suite.originalTitle()
        id: suite.cid
        tests: App.request("new:test:entities")

    getSuiteByTest: (test) ->
      @get(test.parent.cid)

    addTest: (test) ->
      ## find the suite by its id from the cid of the tests parent suite
      suite = @getSuiteByTest(test)
      suite.addTest(test)

    getTest: (test) ->
      suite = @getSuiteByTest(test)
      suite.getTest(test)

    unchooseTests: ->
      @invoke "unchooseTests"

  API =
    getNewSuites: (suites) ->
      new Entities.SuitesCollection suites

  App.reqres.setHandler "new:suite:entities", (suites = []) ->
    API.getNewSuites suites
