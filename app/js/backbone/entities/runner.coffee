@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  testIdRegExp = /\[(.{3})\]$/

  ## create our own private bus channel for communicating with
  ## 3rd party objects outside of our application
  runnerChannel = _.extend {}, Backbone.Events

  class Entities.Runner extends Entities.Model
    defaults: ->
      iframes: []

  ## need to compose this runner with models for each panel
  ## DOM / XHR / LOG
  ## and partial each test (on test run) if its chosen...?
    initialize: ->
      @doms = App.request "dom:entities"
    #   @xhr = App.request "xhr:entity"
    #   @log = App.request "log:entity"

    setContentWindow: (@contentWindow) ->

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

    revertDom: (dom) ->
      console.warn dom
      @trigger "revert:dom", dom.getDom(),
        highlight: dom.get("highlight")
        el: dom.getEl()

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

    getEntitiesByEvent: (event) ->
      obj = {dom: @doms, xhr: @xhrs, log: @logs}
      obj[event or throw new Error("Cannot find entities by event: #{event}")]

    startListening: ->
      @listenTo runnerChannel, "all", (event, runnable, attrs) ->

        ## grab the entities on our instance
        entities = @getEntitiesByEvent(event)
        entities.add attrs, runnable

        ## Do not necessarily need to trigger anything, just need to
        ## expose these entities to the outside world so they can listen
        ## to them themselves
        ## trigger the entities:added event passing up our model and collection
        # @trigger "#{event}:added", model, entities

      ## mocha has begun running the specs per iframe
      @runner.on "start", =>
        ## wipe out all listeners on our private runner bus
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
        ## need to check here if type is hook -- because if its a hook
        ## like beforeEach then test end will never fire
        ## and we need to handle this in the UI somehow...
        ## look at Mocha HTML?
        console.warn("runner has failed", test, err)
        ## set the AssertionError on the test
        test.err = err

      ## if a test is pending mocha will only
      ## emit the pending event instead of the test
      ## so we normalize the pending / test events
      @runner.on "pending", (test) =>
        @trigger "test", test

      @runner.on "test", (test) =>
        ## partials in the runnable object
        ## our private channel
        ## the iframes contentWindow
        ## and the iframe string
        @patchEcl
          runnable: test
          channel: runnerChannel
          contentWindow: @contentWindow
          iframe: @iframe

        @trigger "test", test

      @runner.on "test end", (test) =>
        # test.removeAllListeners()
        console.warn "test end", test
        @trigger "test:end", test
      ## start listening to all the pertinent runner events

    stop: ->
      ## remove all the listeners from EventEmitter
      @runner.removeAllListeners()

      ## delete these properties
      delete @runner
      delete @contentWindow
      delete @iframe
      delete @doms
      delete @xhrs
      delete @logs

      ## cleanup any of our handlers
      @stopListening()

    start: (iframe) ->
      @setIframe iframe

      @triggerLoadIframe @iframe

    triggerLoadIframe: (iframe, opts = {}) ->
      ## clear out the doms and xhrs
      _([@doms]).invoke "reset"

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

      ## store the current iframe
      @setIframe iframe

      ## store the content window so we can
      ## pass this along to our Eclectus methods
      @setContentWindow contentWindow

      ## grep for the correct test / suite by its id if chosenId is set
      ## or all the tests
      @runner.grep @getGrep()

      ## run the suite for the iframe
      ## right before we run the root runner's suite we iterate
      ## through each test and give it a unique id
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