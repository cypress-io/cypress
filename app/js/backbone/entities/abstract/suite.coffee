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

    # removeTestsNotChosen: ->
    #   tests = @get("tests")
    #   tests.remove tests.where chosen: false

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

    # removeSuitesAndTestsNotChosen: ->
    #   ## remove all tests not chosen
    #   @invoke "removeTestsNotChosen"

    #   ## if we have a currently chosen suite
    #   chosen = @getFirstChosen()

    #   ## remove the tests not chosen
    #   chosen.removeTestsNotChosen() if chosen

    #   ## remove any unchosen suites
    #   @remove @where(chosen: false)

    resetTestsOrClearOne: ->
      ## remove all of the tests in the suite
      ## if we are chosen
      if chosen = @getFirstChosen()
        chosen.get("tests").reset()

      else
        ## find the test thats chosen + reset its attrs
        tests = @reduce (memo, suite) ->
          memo = memo.concat suite.get("tests").models
        , []
        test = tests.find (test) -> test.isChosen()
        test.reset()

  API =
    getNewSuites: (suites) ->
      new Entities.SuitesCollection suites

  App.reqres.setHandler "new:suite:entities", (suites = []) ->
    API.getNewSuites suites
