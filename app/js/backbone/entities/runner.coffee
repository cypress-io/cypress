@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  do ($Cypress) ->

    testIdRegExp = /\[(.{3})\]$/

    class Entities.Runner extends Entities.Model
      defaults: ->
        iframes: []

    ## need to compose this runner with models for each panel
    ## DOM / XHR / LOG
    ## and partial each test (on test run) if its chosenId...?
      initialize: ->
        @satelliteEvents  = App.request "satellite:events"
        @hostEvents       = App.request "host:events"
        @passThruEvents   = App.request "pass:thru:events"

      setContentWindow: (@contentWindow, @$remoteIframe) ->

      setIframe: (@iframe) ->

      setOptions: (@mocha, @options) ->

      runSauce: ->
        socket = App.request "socket:entity"

        ## when we get a response from the server with
        ## the jobName we notify all parties
        socket.emit "run:sauce", @iframe, (jobName, batchId) =>
          @trigger "sauce:running", jobName, batchId

      switchToBrowser: (browser, version) ->
        @trigger "switch:to:manual:browser", browser, version

      setBrowserAndVersion: (browser, version) ->
        @set
          browser: browser
          version: version

      setSocketListeners: ->
        socket = App.request "socket:entity"

        ## whenever our socket fires 'test:changed' we want to
        ## proxy this to everyone else
        @listenTo socket, "test:changed", @reRun

        if App.config.ui("satellite")
          _.each @hostEvents, (event) =>
            @listenTo socket, event, (args...) =>
              @trigger event, args...

        if App.config.ui("host")
          _.each @satelliteEvents, (event) =>
            @listenTo socket, event, (args...) =>
              @trigger event, args...

        _.each @passThruEvents, (event) =>
          @listenTo socket, event, (args...) =>
            if event is "command:add"
              @commands.add args...
            else
              @trigger event, args...

      changeRunnableTimeout: (runnable) ->
        runnable.timeout App.config.get("commandTimeout")

      startListening: ->
        @setListenersForAll()
        @setListenersForCI() if App.config.ui("ci")
        @setListenersForWeb() if not App.config.ui("ci")

      setListenersForAll: ->
        @runner.on "test:before:hooks", (hook, suite) =>
          Cypress.LocalStorage.clear([], window.localStorage, @$remoteIframe.prop("contentWindow").localStorage)

          ## if we dont have a test already set then go
          ## find it from the hook
          # @test = @getTestFromHook(hook, suite) if not @test

        @runner.on "test", (test) =>
          @changeRunnableTimeout(test)

          # @test = test
          # @hook = "test"

          test.group = test.title

          # Cypress.set(test, @hook)

        @runner.on "hook", (hook) =>
          @changeRunnableTimeout(hook)

          # @hook = @getHookName(hook)

          ## if the hook is already associated to the test
          ## just use that, else go find it
          test       = hook.ctx.currentTest or @getTestFromHook(hook, hook.parent)
          hook.cid   = test.cid
          hook.group = test.title

          ## set the hook as our current runnable
          # Cypress.set(hook, @hook)

      setListenersForCI: ->

      setListenersForWeb: ->
        @runner.on "suite end", (suite) =>
          suite.removeAllListeners()
          # @trigger "suite:stop", suite

        @runner.on "test end", (test) =>
          ## dont retrigger this event if its failedFromHook
          ## in that case we've already captured it
          @trigger("test:end", test) unless test.failedFromHook

          ## remove the hook reference from the test
          test.removeAllListeners()
        ## start listening to all the pertinent runner events

        @runner.on "hook end", (hook) ->
          hook.removeAllListeners()

      trigger: (event, args...) ->
        ## because of defaults the change:iframes event
        ## fires before our initialize (which is stupid)
        return if not @satelliteEvents

        socket = App.request "socket:entity"

        ## if we're in satellite mode and our event is
        ## a satellite event then emit over websockets
        if App.config.ui("satellite") and event in @satelliteEvents
          args   = @transformRunnableArgs(args)
          return socket.emit event, args...

        ## if we're in host mode and our event is a
        ## satellite event AND we have a remoteIrame defined
        if App.config.ui("host") and event in @hostEvents and @$remoteIframe
          return socket.emit event, args...

        ## else just do the normal trigger and
        ## remove the satellite namespace
        super event, args...

      transformEmitAttrs: (attrs) ->
        obj = {}

        ## normally we'd use a reduce here but for some reason
        ## on dom attrs the reduce completely barfs and is not
        ## able to iterate over the object.
        for key, value of attrs
          obj[key] = value if @isWebSocketCompatibleValue(value)

        obj

      ## make sure this value is capable
      ## of being sent through websockets
      isWebSocketCompatibleValue: (value) ->
        switch
          when _.isElement(value)                           then false
          when _.isObject(value) and _.isElement(value[0])  then false
          when _.isFunction(value)                          then false
          else true

      transformRunnableArgs: (args) ->
        ## pull off these direct properties
        props = ["title", "cid", "root", "pending", "stopped", "state", "duration", "type"]

        ## pull off these parent props
        parentProps = ["root", "cid"]

        ## fns to invoke
        fns = ["originalTitle", "fullTitle", "slow", "timeout"]

        _(args).map (arg) =>
          ## transfer direct props
          obj = _(arg).pick props...

          ## transfer parent props
          if parent = arg.parent
            obj.parent = _(parent).pick parentProps...

          ## transfer the error as JSON
          if err = arg.err
            err.host = @$remoteIframe.prop("contentWindow").location.host
            obj.err = JSON.stringify(err, ["message", "type", "name", "stack", "fileName", "lineNumber", "columnNumber", "host"])

          ## invoke the functions and set those as properties
          _.each fns, (fn) ->
            obj[fn] = _.result(arg, fn)

          obj

      ## tell our runner to run our iframes mocha suite
      runIframeSuite: (iframe, contentWindow, remoteIframe, options, fn) ->
        @setMochaRunner()

        ## options are optional and so if fn is undefined
        ## we automatically set it to options
        ## this allows consumers to pass a fn
        ## as the last argument even though it
        ## will be received as options
        if _.isUndefined(fn)
          fn = options

        ## store the current iframe
        @setIframe iframe

        ## store the content window so we can
        ## pass this along to our Eclectus methods
        @setContentWindow contentWindow, remoteIframe

        ## don't attempt to run any tests if we're in manual
        ## testing mode and our iframe is not readable
        return if not remoteIframe.isReadable()

        ## this is where we should automatically patch Ecl/Cy proto's
        ## with the iframe contentWindow, and remote iframe
        ## as of now we're passing App.confg into cypress but i dont like
        ## leaking this backbone model's details into the cypress API
        Cypress.setup(@runner, remoteIframe, App.config.getExternalInterface())

        r = Cypress.runner(@runner)

        ## reupdate chosen with the passed in chosenId
        ## this allows us to pass the chosenId around
        ## through websockets
        @updateChosen(options.chosenId)

  App.reqres.setHandler "runner:entity", (mocha) ->
    ## always set grep if its not already set
    mocha.options.grep ?= /.*/

    ## store the actual mochaRunner on ourselves
    runner = new Entities.Runner
    runner.setSocketListeners()
    runner.setOptions mocha, mocha.options
    runner
