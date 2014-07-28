@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  testIdRegExp = /\[(.{3})\]$/

  class Entities.Runner extends Entities.Model
    defaults: ->
      total: 0
      failed: 0
      passed: 0
      iframes: []

    setIframe: (@iframe) ->

    getTestCid: (test) ->
      ## grab the test id from the test's title
      matches = testIdRegExp.exec(test.title)

      ## use the captured group if there was a match
      matches and matches[1]

    setTestRunner: (runner) ->
      ## store the test runner as a property on ourselves
      @runner = runner

      ## override the runSuite function on our runner instance
      ## this is used to generate properly unique regex's for grepping
      ## through a specific test
      socket = App.request "socket:entity"

      runner = @

      ## TODO: IMPLEMENT FOR SUITES
      @runner.runSuite = _.wrap @runner.runSuite, (runSuite, suite, fn) ->
        ## iterate through each test
        generatedIds = []

        suite.eachTest (test) =>
          test.cid ?= runner.getTestCid(test)

          ## if test doesnt have an id
          if not test.cid
            df = $.Deferred()

            generatedIds.push df

            data = {title: test.title, spec: runner.iframe}
            socket.emit "generate:test:id", data, (id) ->
              test.cid = id
              df.resolve id

          ## override each test's fullTitle to include its cid
          ## this cant use cid, since when the iframe reloads
          ## each test will have a unique id again -- this is why
          ## you have to use client id's in the title in the
          ## original spec
          test.fullTitle = _.wrap test.fullTitle, (origTitle) ->
            title = origTitle.apply(@)
            title + " [" + test.cid + "]"

        # console.info generatedIds
        $.when(generatedIds...).done =>
          runSuite.call(@, suite, fn)

    startListening: ->
      ## mocha has begun running the specs per iframe
      @runner.on "start", =>
        console.warn "RUNNER HAS STARTED"
        @trigger "runner:start"

      @runner.on "end", =>
        console.warn "RUNNER HAS ENDED"
        @trigger "runner:end"

      @runner.on "suite", (suite) =>
        console.warn "suite", suite
        suite.cid = _.uniqueId("suite")
        @trigger "suite:start", suite

      @runner.on "suite end", (suite) =>
        @trigger "suite:stop", suite

      # @runner.on "suite end", (suite) ->
      #   console.warn "suite end", suite

      @runner.on "fail", (test, err) =>
        console.warn("runner has failed", test, err)
        ## set the AssertionError on the test
        test.err = err

      ## if a test is pending mocha will only
      ## emit the pending event instead of the test
      ## so we normalize the pending / test events
      @runner.on "pending", (test) =>
        test.cid ?= _.uniqueId("test")
        @trigger "test", test

      @runner.on "test", (test) =>
        ## need to do this temporarily until we add id's to suites
        test.cid ?= _.uniqueId("test")
        @trigger "test", test

      @runner.on "test end", (test) =>
        console.warn "test end", test
        @trigger "test:end", test
      ## start listening to all the pertinent runner events

    stop: ->
      ## remove all the listeners from EventEmitter
      @runner.removeAllListeners()

      ## delete this property
      delete @runner

    start: (iframe) ->
      console.warn "starting", iframe
      @trigger "load:iframe", iframe

    ## sets the id of the test/suite which has been chosen in the UI
    setChosenId: (id) ->
      @set "chosenId", id

    escapeId: (id) ->
      id.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

    runIframeSuite: (iframe, contentWindow) ->
      ## tell our runner to run our iframes mocha suite
      console.info("runIframeSuite", @runner, iframe, contentWindow.mocha.suite)

      ## right before we run the root runner's suite we iterate
      ## through each test and give it a unique id
      @setIframe iframe

      ## grep for the correct test / suite by its id if chosenId is set
      if id = @get("chosenId")
        testOrSuiteId = new RegExp(@escapeId("[" + id + "]") + "\$")
        @runner.grep testOrSuiteId

      ## run the suite for the iframe
      @runner.runSuite contentWindow.mocha.suite, ->
        console.log "finished running the iframes suite!"

  API =
    getRunner: (testRunner) ->
      ## store the actual testRunner on ourselves
      runner = new Entities.Runner
      runner.setTestRunner testRunner
      runner.startListening()
      runner

  App.reqres.setHandler "runner:entity", (testRunner) ->
    API.getRunner(testRunner)