@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Suite extends Entities.Model
    addTest: (test) ->
      @get("tests").addTest(test)

    getTest: (test) ->
      @get("tests").get(test.cid).getResults(test)

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
      suite.getTest(test).getResults()

  API =
    getNewSuites: (suites) ->
      new Entities.SuitesCollection suites

  App.reqres.setHandler "new:suite:entities", (suites = []) ->
    API.getNewSuites suites
