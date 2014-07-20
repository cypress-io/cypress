@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Suite extends Entities.Model
    defaults: ->
      state: "pending"

    addTest: (test) ->
      @get("tests").addTest(test)

    getTest: (test) ->
      @get("tests").get(test.cid)

    anyArePending: (states) ->
      _(states).any (state) -> state is "pending"

    anyAreFailed: (states) ->
      _(states).any (state) -> state is "failed"

    allArePassed: (states) ->
      _(states).all (state) -> state is "passed"

    updateState: ->
      # _(states).any (state) -> state is "pending"
      ## grab all of the states of the tests
      # tests = @get("tests")
      states = @get("tests").pluck("state")

      state = switch
        when @anyArePending(states) then "pending"
        when @anyAreFailed(states) then "failed"
        when @allArePassed(states) then "passed"

      @set state: state

  class Entities.SuitesCollection extends Entities.Collection
    model: Entities.Suite

    addSuite: (suite) ->
      @add
        title: suite.title
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

  API =
    getNewSuites: (suites) ->
      new Entities.SuitesCollection suites

  App.reqres.setHandler "new:suite:entities", (suites = []) ->
    API.getNewSuites suites
