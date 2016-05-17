@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  do ($Cypress) ->

    runnableIdRegExp = /\[(.{3})\]$/
    regExpCharacters = /[-\/\\^$*+?.()|[\]{}]/g

    CypressEvents = "run:start run:end suite:start suite:end hook:start hook:end test:start test:end".split(" ")

    alphabet = "abcdefghijklmnopqrstuvwxyz0123456789"

    class Entities.Runner extends Entities.Model
      initialize: ->
        @Cypress = $Cypress.create({loadModules: true})

        if App.config.get("isHeadless")
          $Cypress.isHeadless = true

        @satelliteEvents = App.request("satellite:events")
        @passThruEvents  = App.request("pass:thru:events")
        @hostEvents      = App.request("host:events")

        @commands  = App.request "command:entities"
        @routes    = App.request "route:entities"
        @agents    = App.request "agent:entities"
        @socket    = App.request "socket:entity"
        @iframe    = App.request "iframe:entity", @, @Cypress
        @stats     = App.request "stats:entity", @

        _.each @passThruEvents, (event) =>
          @listenTo @socket, event, (args...) =>
            @trigger event, args...

        _.each CypressEvents, (event) =>
          @listenTo @Cypress, event, (args...) =>
            @trigger event, args...

        @listenTo @Cypress, "run:start", =>
          @socket.emit "mocha", "start"

        @listenTo @Cypress, "run:end", =>
          @socket.emit "mocha", "end"

        @listenTo @Cypress, "suite:start", (suite) =>
          @socket.emit "mocha", "suite", suite

        @listenTo @Cypress, "suite:end", (suite) =>
          @socket.emit "mocha", "suite end", suite

        @listenTo @Cypress, "test:start", (test) =>
          @socket.emit "mocha", "test", test

        @listenTo @Cypress, "test:end", (test) =>
          @socket.emit "mocha", "test end", test

        @listenTo @Cypress, "mocha:pending", (test) =>
          @socket.emit "mocha", "pending", test

        @listenTo @Cypress, "mocha:pass", (test) =>
          @socket.emit "mocha", "pass", test

        @listenTo @Cypress, "mocha:fail", (test, err) =>
          @socket.emit "mocha", "fail", test, err

        @listenTo @Cypress, "get:cookies", (options, cb) =>
          @socket.emit "automation:request", "get:cookies", options, cb

        @listenTo @Cypress, "get:cookie", (options, cb) =>
          @socket.emit "automation:request", "get:cookie", options, cb

        @listenTo @Cypress, "set:cookie", (options, cb) =>
          @socket.emit "automation:request", "set:cookie", options, cb

        @listenTo @Cypress, "clear:cookie", (options, cb) =>
          @socket.emit "automation:request", "clear:cookie", options, cb

        @listenTo @Cypress, "clear:cookies", (options, cb) =>
          @socket.emit "automation:request", "clear:cookies", options, cb

        @listenTo @Cypress, "message", (msg, data, cb) =>
          @socket.emit "client:request", msg, data, cb

        @listenTo @Cypress, "fixture", (fixture, cb) =>
          @socket.emit "fixture", fixture, cb

        @listenTo @Cypress, "request", (options, cb) =>
          @socket.emit "request", options, cb

        @listenTo @Cypress, "history:entries", (cb) =>
          @socket.emit "history:entries", cb

        @listenTo @Cypress, "initialized", (obj) =>
          @receivedRunner(obj.runner)

        @listenTo @Cypress, "paused", (nextCmd) =>
          @trigger "paused", nextCmd

        ## dont do anything else if we're in headless mode
        return if $Cypress.isHeadless

        if App.config.ui("host")
          _.each @satelliteEvents, (event) =>
            @listenTo @socket, event, (args...) =>
              switch event
                when "command:add"
                  attrs = args[0]
                  log = new @Cypress.Log(@Cypress, attrs)
                  c = @commands.add log
                  c.set("id", attrs.id)
                when "command:attrs:changed"
                  attrs = args[0]
                  @commands.get(attrs.id).set(attrs)
                else
                  @trigger event, args...

          _.each ["url:changed", "page:loading"], (event) =>
            @listenTo @socket, event, (args...) =>
              @Cypress.trigger event, args...

        if App.config.ui("satellite")
          _.each @hostEvents, (event) =>
            @listenTo @socket, event, (args...) =>
              @trigger event, args...

          @listenTo @commands, "command:attrs:changed", (attrs) ->
            attrs = @transformEmitAttrs(attrs)
            @socket.emit "command:attrs:changed", attrs

          _.each ["url:changed", "page:loading"], (event) =>
            @listenTo @Cypress, event, (args...) =>
              @socket.emit event, args...

        @listenTo @Cypress, "log", (log) =>
          switch log.get("instrument")
            when "command"
              id = _.uniqueId("command")

              ## if we're in satellite mode then we need to
              ## broadcast this through websockets
              if App.config.ui("satellite")
                attrs = @transformEmitAttrs(log.attributes)
                attrs.id = id
                @socket.emit "command:add", attrs

              c = @commands.add log
              c.set "id", id

            when "route"
              @routes.add log

            when "agent"
              @agents.add log

            else
              throw new Error("Cypress.log() emitted an unknown instrument: #{log.get('instrument')}")

        @listenTo @socket, "test:changed", @reRun

      start: (specPath) ->
        @Cypress.start()

        ## configure cypress at the earliest stages so
        ## that any spec files / helpers have the configuration
        ## avilable ASAP
        @Cypress.setConfig(App.config.getCypressConfig())

        @triggerLoadSpecFrame specPath, {start: true}

      stop: ->
        ## shut down Cypress
        ## wait for promise to resolve
        @Cypress.stop().then =>
          ## remove our listeners
          ## for socket + Cypress
          @stopListening()

          @restore()

      restore: ->
        ## reset the entities
        @reset()

        ## and remove actual references to them
        _.each ["commands", "routes", "agents", "chosen", "specPath", "socket", "iframe", "Cypress"], (obj) =>
          @[obj] = null

      reset: ->
        _.each [@commands, @routes, @agents], (collection) ->
          collection.reset([], {silent: true})

      trigger: (event, args...) ->
        ## because of defaults the change:iframes event
        ## fires before our initialize (which is stupid)
        return if not @socket

        ## if we're in satellite mode and our event is
        ## a satellite event then emit over websockets
        if App.config.ui("satellite") and event in @satelliteEvents
          args = @transformRunnableArgs(args)
          return @socket.emit event, args...

        ## if we're in host mode and our event is a
        ## satellite event AND we have a remoteIrame defined
        # if App.config.ui("host") and event in @hostEvents #and @$remoteIframe
          # debugger
          # return @socket.emit event, args...

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
        props = ["title", "id", "root", "pending", "stopped", "state", "duration", "type"]

        ## pull off these parent props
        parentProps = ["root", "id"]

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
            try
              err.host = @Cypress.cy.$remoteIframe.prop("contentWindow").location.host

            obj.err = JSON.stringify(err, ["message", "type", "name", "stack", "fileName", "lineNumber", "columnNumber", "host"])

          ## invoke the functions and set those as properties
          _.each fns, (fn) ->
            obj[fn] = _.result(arg, fn)

          obj

      resume: ->
        @trigger("resumed")
        @Cypress.trigger("resume:all")

      abort: ->
        @Cypress.abort()

      next: ->
        @Cypress.trigger("resume:next")

      getChosen: ->
        @chosen

      hasChosen: ->
        !!@get("chosenId")

      updateChosen: (id) ->
        ## set chosenId as runnable if present else unset
        if id then @set("chosenId", id) else @unset("chosenId")

      setChosen: (runnable) ->
        if runnable
          @chosen = runnable
        else
          @chosen = null

        @updateChosen(runnable?.id)

        ## always reload the iframe
        @reRun @specPath

      restart: ->
        ## always reload the iframe
        @reRun @specPath

      logResults: (test) ->
        @trigger "test:results:ready", test

      reRun: (specPath, options = {}) ->
        ## abort if we're being told to rerun
        ## tests for a specPath we're not
        ## currently watching
        return if specPath isnt @specPath

        ## when we are re-running we first
        ## need to abort cypress always
        @Cypress.abort().then =>
          ## start the abort process since we're about
          ## to load up in case we're running any tests
          ## right this moment

          ## tells different areas of the app to prepare
          ## for the resetting of the test run
          @trigger "reset:test:run"

          @triggerLoadSpecFrame(specPath, options)

      triggerLoadSpecFrame: (@specPath, options = {}) ->
        _.defaults options,
          chosenId: @get("chosenId")
          specPath: @specPath
          start:    false

        ## reset our collection entities
        @reset()

        ## bail if we're the host and we aren't initially kicking
        ## off the whole process
        return if App.config.ui("host") and options.start isnt true

        ## pass the run method as our callback bound to us
        run = _.bind(@run, @)

        ## tells the iframe view to load up a new iframe
        @iframe.load(run, options)

      getRunnableId: (runnable) ->
        ## grab the runnable id from the runnable's title
        matches = runnableIdRegExp.exec(runnable.title)

        ## use the captured group if there was a match
        (matches and matches[1]) or @generateId()

      idSuffix: (title) ->
        matches = title.match runnableIdRegExp
        matches and matches[0]
        # " [" + id + "]"

      generateId: ->
        ids = _(3).times => @getRandom(alphabet)
        ids.join("")

      getRandom: (alphabet) ->
        index = Math.floor(Math.random() * alphabet.length)
        alphabet[index]

      ## strip out the id suffix from the runnable title
      originalTitle: (runnable) ->
        _.rtrim runnable.title, @idSuffix(runnable.title)

      createUniqueRunnableId: (runnable, ids) ->
        id = runnable.id ?= @getRunnableId(runnable)

        until id not in ids
          id = @generateId()

        return runnable.id = id

      receivedRunner: (runner) ->
        @trigger "before:add"

        runnables = []
        ids = []

        triggerAddEvent = (runnable) =>
          @trigger("#{runnable.type}:add", runnable)

        getRunnables = (options = {}) =>
          _.defaults options,
            pushRunnables: true
            triggerAddEvent: true

          ## on the first iteration we want to simply collect
          ## all of the runnable ids, and filter out any runnables
          ## which dont have an id (or a duplicate id?)
          runner.getRunnables
            onRunnable: (runnable) =>
              runnables.push(runnable) if options.pushRunnables

              id = @createUniqueRunnableId(runnable, ids)

              ids.push(id)

              ## force our runner to ignore running this
              ## test if it doesnt have an id!
              ## or if it has a duplicate id, nuke it including
              ## any children.
              ## just remove the children if its a suite
              # runner.ignore(runnable) if not runnable.id

              ## allow to get the original title without the id
              runnable.originalTitle ?= @originalTitle(runnable)

              triggerAddEvent(runnable) if options.triggerAddEvent

        ## if we have a chosen id
        if @hasChosen()
          id = @get("chosenId")

          ## get our runnables now
          getRunnables({triggerAddEvent: false})

          ## and its an id within our runnables.
          ## we do this to ensure that the user
          ## didnt previously select this test
          ## and then modify the spec and remove
          ## this specific id
          if id in ids
            ## reset ids at the end to prevent
            ## accidentally generating random ids
            ## due to ids closure in onRunnable
            ids = []

            ## make the runner grep for just this unique id!
            runner.grep @escapeRegExp("[" + id + "]")

            ## get the runnables again since we now
            ## have to iterate through them again
            ## to see which ones should be added
            ## we dont need to push the ids or push
            ## the runnables since its a temp var anyway
            getRunnables({pushRunnables: false})
          else
            ## remove the chosen id since its not
            ## longer in the spec file!
            @updateChosen()

            ## trigger the triggerAddEvent on all of
            ## our existing runnables!
            _.each runnables, triggerAddEvent
        else
          ## if we havent chosen anything to begin with
          ## then just iterate through all the runnables
          ## and fire away!
          getRunnables()

        @trigger "after:add"

        return @

      escapeRegExp: (str) ->
        new RegExp str.replace(regExpCharacters, '\\$&')

      runInHostMode: (options) ->
        if options.browser is "chromium"
          @socket.emit "run:tests:in:chromium", "http://localhost:2020/__/#/tests/#{options.specPath}?__ui=satellite"

      run: (specWindow, remoteIframe, options, fn) ->
        ## dont try to start tests in host mode since our
        ## satellite is the browser which is actually running
        ## the tests
        return @runInHostMode(options) if App.config.ui("host")

        ## trigger before:run prior to setting up the runner
        @trigger "before:run"

        ## initialize the helper objects for Cypress to be able
        ## to run tests
        @Cypress.initialize(specWindow, remoteIframe)

        ## capture start date
        start = new Date

        @Cypress.run (err, results) =>
          @Cypress.after(err)

          ## trigger the after run event
          @trigger "after:run"

          fn?(err)

          if _.isFunction($Cypress.afterRun)
            ## send duration + test results
            end = new Date - start
            $Cypress.afterRun(end, results)

    App.reqres.setHandler "runner:entity", ->
      new Entities.Runner