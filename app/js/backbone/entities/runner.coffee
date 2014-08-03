@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  testIdRegExp = /\[(.{3})\]$/

  class Entities.Runner extends Entities.Model
    defaults: ->
      iframes: []

  ## need to compose this runner with models for each panel
  ## DOM / XHR / LOG
  ## and partial each test (on test run) if its chosen...?
    # initialize: ->
    #   @dom = App.request "dom:entity"
    #   @xhr = App.request "xhr:entity"
    #   @log = App.request "log:entity"

    setIframe: (@iframe) ->

    setEclPatch: (@patchEcl) ->

    getTestCid: (test) ->
      ## grab the test id from the test's title
      matches = testIdRegExp.exec(test.title)

      ## use the captured group if there was a match
      matches and matches[1]

    getIdToAppend: (cid) ->
      " [" + cid + "]"

    logResults: (test) ->
      @trigger "test:results:ready", test

    # patchEclForTest: (test) ->
      # @eclPatch(test)

    setTestRunner: (runner) ->
      ## store the test runner as a property on ourselves
      @runner = runner

      ## override the runSuite function on our runner instance
      ## this is used to generate properly unique regex's for grepping
      ## through a specific test
      socket = App.request "socket:entity"

      ## whenever our socket fires 'test:changed' we want to
      ## proxy this to everyone else
      @listenTo socket, "test:changed", @triggerLoadIframe

      _this = @

      ## TODO: IMPLEMENT FOR SUITES
      @runner.runSuite = _.wrap @runner.runSuite, (runSuite, suite, fn) ->
        ## iterate through each test
        generatedIds = []

        suite.eachTest (test) ->
          ## iterating on both the test and its parent (the suite)
          _.each [test, test.parent], (type) ->
            ## bail if we're the root runnable
            return if type.root

            ## allow to get the original title
            type.originalTitle = ->
              @title.replace _this.getIdToAppend(type.cid), ""

            ## parse the cid out of the title if it exists
            type.cid ?= _this.getTestCid(type)

            ## if test or suite doesnt have a cid
            if not type.cid
              ## override each test's and suite's fullTitle to include its real id
              ## this cant use a regular client id, since when the iframe reloads
              ## each test will have a unique id again -- this is why
              ## you have to use client id's in the title in the
              ## original spec

              type.fullTitle = _.wrap type.fullTitle, (origTitle) ->
                title = origTitle.apply(@)
                title + _this.getIdToAppend(type.cid)

              df = $.Deferred()

              generatedIds.push df

              ## go get the id from the server via websockets
              data = {title: type.title, spec: _this.iframe}
              socket.emit "generate:test:id", data, (id) ->
                type.cid = id
                df.resolve id

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
        @trigger "test", test

      @runner.on "test", (test) =>
        ## partials in the test object
        ## into any Ecl command
        @patchEcl(test)
        # test.on "find", (details) ->
        # test.on "dom", @dom.getEvent
        # test.on "xhr", @xhr.getEvent

        # @patchEclForTest(test)

        @trigger "test", test

      @runner.on "test end", (test) =>
        # test.removeAllListeners()
        console.warn "test end", test
        @trigger "test:end", test
      ## start listening to all the pertinent runner events

    stop: ->
      ## remove all the listeners from EventEmitter
      @runner.removeAllListeners()

      ## delete this property
      delete @runner

      ## cleanup any of our handlers
      @stopListening()

    start: (iframe) ->
      @setIframe iframe

      @triggerLoadIframe @iframe

    triggerLoadIframe: (iframe, opts = {}) ->
      ## set any outstanding test to pending and stopped
      ## so we bypass all old ones
      @runner.suite.eachTest (test) ->
        test.pending = true
        test.stopped = true
        while obj = test.parent
          return if obj.stopped
          obj.pending = true
          obj.stopped = true
          obj = obj.parent

      ## first we want to make sure that our last stored
      ## iframe matches the one we're receiving
      return if iframe isnt @iframe

      ## if it does fire the event
      @trigger "load:iframe", @iframe, opts

    hasChosen: ->
      !!@get("chosen")

    setChosen: (runnable) ->
      ## set chosen as runnable if present else unset
      if runnable then @set("chosen", runnable) else @unset("chosen")

      ## always reload the iframe
      @triggerLoadIframe @iframe

    getGrep: ->
      if chosen = @get("chosen")
        ## create a regex based on the id of the suite / test
        new RegExp @escapeId("[" + chosen.id + "]")

      else
        ## just use every test
        /.*/

    escapeId: (id) ->
      id.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

    runIframeSuite: (iframe, contentWindow) ->
      ## tell our runner to run our iframes mocha suite
      console.info("runIframeSuite", @runner, iframe, contentWindow.mocha.suite)

      ## right before we run the root runner's suite we iterate
      ## through each test and give it a unique id
      @setIframe iframe

      ## grep for the correct test / suite by its id if chosenId is set
      ## or all the tests
      @runner.grep @getGrep()

      ## run the suite for the iframe
      @runner.runSuite contentWindow.mocha.suite, ->
        console.log "finished running the iframes suite!"

  API =
    getRunner: (testRunner, patch) ->
      ## store the actual testRunner on ourselves
      runner = new Entities.Runner
      runner.setTestRunner testRunner
      runner.setEclPatch patch
      runner.startListening()
      runner

  App.reqres.setHandler "runner:entity", (testRunner, patch) ->
    API.getRunner(testRunner, patch)