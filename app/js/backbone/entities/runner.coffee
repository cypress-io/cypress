@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  do (Cypress) ->

    testIdRegExp = /\[(.{3})\]$/

    class Entities.Runner extends Entities.Model
      defaults: ->
        iframes: []
        browser: null
        version: null

    ## need to compose this runner with models for each panel
    ## DOM / XHR / LOG
    ## and partial each test (on test run) if its chosenId...?
      initialize: ->
        @hooks            = App.request "hook:entities"
        @commands         = App.request "command:entities"
        @routes           = App.request "route:entities"
        @agents           = App.request "agent:entities"
        @satelliteEvents  = App.request "satellite:events"
        @hostEvents       = App.request "host:events"
        @passThruEvents   = App.request "pass:thru:events"
        @tests            = [] ## not sure why we're setting this since tests are set on the mocha runner not on our runner model
        @hook             = null
        @test             = null

      setContentWindow: (@contentWindow, @$remoteIframe) ->

      setIframe: (@iframe) ->

      setOptions: (@mocha, @options) ->

      runSauce: ->
        socket = App.request "socket:entity"

        ## when we get a response from the server with
        ## the jobName we notify all parties
        socket.emit "run:sauce", @iframe, (jobName, batchId) =>
          @trigger "sauce:running", jobName, batchId

      revertDom: (command, init = true) ->
        return @trigger "restore:dom" if not init

        return if not command.hasSnapshot()

        @trigger "revert:dom", command.getSnapshot(),
          id:   command.cid
          el:   command.getEl()
          attr: command.get("highlightAttr")

      highlightEl: (command, init = true) ->
        @trigger "highlight:el", command.getEl(),
          id: command.cid
          init: init

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

        @listenTo Cypress, "log", (log) =>
          switch log.get("event")
            when "command"
              ## think about moving this line
              ## back into Cypress
              log.set "hook", @hook

              ## if we're in satellite mode then we need to
              ## broadcast this through websockets
              if App.config.ui("satellite")
                attrs = @transformEmitAttrs(attrs)
                socket.emit "command:add", attrs
              else
                @commands.add log

            when "route"
              @routes.add log

            when "agent"
              @agents.add log

            else
              throw new Error("Cypress.log() emitted an unknown event: #{log.get('event')}")

      setMochaRunner: ->
        throw new Error("Runner#mocha is missing!") if not @mocha

        ## nuke the previous runner's listeners if we have one
        @runner.removeAllListeners() if @runner

        ## store the test runner as a property on ourselves
        @runner = @mocha.run()

        ## start listening the gazillion
        ## runner emit events
        @startListening()

        ## override the runSuite function on our runner instance
        ## this is used to generate properly unique regex's for grepping
        ## through a specific test

        runner = @

        ## monkey patch the hook event so we can wrap
        ## 'test:before:hooks' and 'test:after:hooks' around all of
        ## the hooks surrounding a test runnable
        @runner.hook = _.wrap @runner.hook, (orig, name, fn) ->
          hooks = @suite["_" + name]
          _this = @

          getAllTests = (suite) ->
            tests = []
            suite.eachTest (test) ->
              ## iterate through each of our suites tests.
              ## this will iterate through all nested tests
              ## as well.  and then we add it only if its
              ## in our grepp'd runner.tests array
              tests.push(test) if test in runner.tests
            tests

          ## we have to see if this is the last suite amongst
          ## its siblings.  but first we have to filter out
          ## suites which dont have a grepp'd test in them
          isLastSuite = (suite) ->
            ## grab all of the suites from our grep'd tests
            ## including all of their ancestor suites!
            suites = _.reduce runner.tests, (memo, test) ->
              while parent = test.parent
                memo.push(parent)
                test = parent
              memo
            , []

            ## intersect them with our parent suites and see if the last one is us
            _.chain(suites).uniq().intersection(suite.parent.suites).last().value() is suite

          switch name
            when "beforeAll"
              ## if we're the root suite we know to fire
              if @suite.root
                _this.emit("test:before:hooks", hooks[0], @suite)

            when "beforeEach"
              ## we havent yet set runner.test here so we can't work off of that
              if @suite.root and runner.test isnt runner.tests[0]
                _this.emit("test:before:hooks", hooks[0], @suite)

            when "afterEach"
              ## find all of the grep'd runner tests which share
              ## the same parent suite as our current runner test
              tests = getAllTests(runner.test.parent)

              ## make sure this test isnt the last test overall but also
              ## isnt the last test in our grep'd parent suite's tests array
              if @suite.root and (runner.test isnt _(runner.tests).last()) and (runner.test isnt _(tests).last())
                fn = _.wrap fn, (orig, args...) ->
                  _this.emit("test:after:hooks")
                  orig(args...)

            when "afterAll"
              ## find all of the grep'd runner tests which share
              ## the same parent suite as our current runner test
              if runner.test

                tests = getAllTests(runner.test.parent)

                ## if we're the very last test in the entire runner.tests
                ## we wait until the root suite fires
                ## else we wait until the very last possible moment by waiting
                ## until the root suite is the parent of the current suite
                ## since that will bubble up IF we're the last nested suite
                ## else if we arent the last nested suite we fire if we're
                ## the last test
                if (@suite.root and runner.test is _(runner.tests).last()) or
                  (@suite.parent.root and runner.test is _(tests).last()) or
                    (not isLastSuite(@suite) and runner.test is _(tests).last())
                  fn = _.wrap fn, (orig, args...) ->
                    _this.emit("test:after:hooks")
                    orig(args...)

          orig.call(@, name, fn)

      getCommands: ->
        @commands

      getRoutes: ->
        @routes

      getAgents: ->
        @agents

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
          @test = @getTestFromHook(hook, suite) if not @test

        @runner.on "test:after:hooks", =>
          ## restore the cy instance between tests
          Cypress.restore()

          ## we want to clear any set hook + test
          ## since this is the last event that will be fired
          ## until we either move onto the next test or quit
          @hook = null
          @test = null

        @runner.on "suite", (suite) =>
          @trigger "suite:start", suite

        @runner.on "test", (test) =>
          @changeRunnableTimeout(test)

          @test = test
          @hook = "test"

          test.group = test.title

          Cypress.set(test, @hook)

        @runner.on "hook", (hook) =>
          @changeRunnableTimeout(hook)

          @hook = @getHookName(hook)

          ## if the hook is already associated to the test
          ## just use that, else go find it
          test       = hook.ctx.currentTest or @getTestFromHook(hook, hook.parent)
          hook.cid   = test.cid
          hook.group = test.title

          ## set the hook as our current runnable
          Cypress.set(hook, @hook)

        ## when a hook ends we want to re-set Cypress
        ## with the test runnable (if one exists) since
        ## the way mocha fires events for beforeEach's
        @runner.on "hook end", (hook) =>
          if test = hook.ctx.currentTest
            @hook = "test"
            Cypress.set(test)

      setListenersForCI: ->

      setListenersForWeb: ->
        ## mocha has begun running the specs per iframe
        @runner.on "start", =>
          ## wipe out all listeners on our private runner bus
          @trigger "runner:start"

        @runner.on "end", =>
          @trigger "runner:end"

        @runner.on "suite end", (suite) =>
          suite.removeAllListeners()
          @trigger "suite:stop", suite

        # @runner.on "suite end", (suite) ->
        #   console.warn "suite end", suite

        @runner.on "fail", (test, err) =>
          console.warn("runner has failed", test, err)

          ## set the AssertionError on the test
          test.err = err

          ## if this is a hook then we need to make sure
          ## we still submit the test:end event and since
          ## this is a hook we know its related to the first
          ## test of our parent suite
          @hookFailed(test, err) if test.type is "hook"

        ## if a test is pending mocha will only
        ## emit the pending event instead of the test
        ## so we normalize the pending / test events
        @runner.on "pending", (test) =>
          @trigger "test", test

        @runner.on "test", (test) =>
          @trigger "test:start", test

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

      ## recursively tries to find the test associated
      ## with the hook
      getTestFromHook: (hook, suite) ->
        ## if theres already a currentTest use that
        return test if test = hook?.ctx.currentTest

        ## there is a bug where if you have set an 'only'
        ## and you're running a visit within a hook
        ## then this will return the incorrect test
        ## it will return the very first test instead of
        ## our actual running test.  i've looked through
        ## mocha's source and cannot find any way to figure
        ## out which test is running in this scenario.
        ## so i think the only solution is to look at the grep
        ## and grep for the first test that matches it
        grep = @runner._grep
        if grep.toString() isnt "/.*/"
          return test if test = @getFirstTestByFn suite, (test) ->
            grep.test _.result(test, "fullTitle")

        ## else go look for the test because our suite
        ## is most likely the root suite (which does not share a ctx)
        if suite.tests.length
          return suite.tests[0]
        else
          @getTestFromHook(hook, suite.suites[0])

      getHookName: (hook) ->
        ## find the name of the hook by parsing its
        ## title and pulling out whats between the quotes
        name = hook.title.match(/\"(.+)\"/)
        name and name[1]

      hookFailed: (hook, err) ->
        ## finds the test by returning the first test from
        ## the parent or looping through the suites until
        ## it finds the first test
        test = @getTestFromHook(hook, hook.parent)
        test.err = err
        test.state = "failed"
        test.hook = @getHookName(hook)
        test.failedFromHook = true
        @trigger "test:end", test

      stop: ->
        ## clear out the commands
        @commands.reset([], {silent: true})
        @routes.reset([], {silent: true})
        @agents.reset([], {silent: true})

        ## remove all the listeners from EventEmitter
        @runner.removeAllListeners()

        ## cleanup any of our handlers
        socket = App.request "socket:entity"
        @stopListening(socket)
        @stopListening(Cypress, "log")

        ## remove all references to other objects
        ## clear twice to nuke _previousAttributes
        @clear()
        @clear()

        ## null out these properties
        @mocha          = null
        @runner         = null
        @contentWindow  = null
        @$remoteIframe  = null
        @iframe         = null
        @hooks          = null
        @commands       = null
        @routes         = null
        @agents         = null
        @chosen         = null
        @hook           = null
        @test           = null

      # triggerLoadIframe: (iframe, opts = {}) ->
      #   _.defaults opts,
      #     chosenId: @get("chosenId")
      #     browser:  @get("browser")
      #     version:  @get("version")

      #   ## clear out the commands
      #   @commands.reset([], {silent: true})

      #   ## always reset @options.grep to /.*/ so we know
      #   ## if the user has removed a .only in between runs
      #   ## if they havent, it will just be picked back up
      #   ## by mocha
      #   @options.grep = /.*/

      ## this recursively loops through all tests / suites
      ## plucking out their cid's and returning those
      ## this should be refactored since it creates an N+1 loop
      ## through all runnables.  instead this should happen during
      ## the original loop through to ensure we have cid's
      getRunnableCids: (root, ids) ->
        ids ?= []

        ## make sure we push our own cid in here
        ## when we're a suite but not the root!
        ids.push root.cid if root.cid

        _.each root.tests, (test) ->
          ids.push test.cid

        _.each root.suites, (suite) =>
          @getRunnableCids suite, ids

        ids

      getFirstTestByFn: (root, fn) ->
        ## loop through each test applying
        ## the fn and return the first that matches
        for test in root.tests
          return test if fn(test)

        ## return recursively
        for suite in root.suites
          return test if test = @getFirstTestByFn(suite, fn)

      getGrep: (root) ->
        console.warn "GREP IS: ", @options.grep
        return re if re = @parseMochaGrep(@options.grep)

        chosenId = @get("chosenId")

        ## if we have a chosenId model and its in our runnables cid
        if chosenId and chosenId in @getRunnableCids(root)
          ## create a regex based on the id of the suite / test
          return new RegExp @escapeId("[" + chosenId + "]")

        ## lets remove our chosenId runnable since its no longer with us
        else
          @unset "chosenId"

        return /.*/ if not @hasChosen()

      parseMochaGrep: (re) ->
        re = re.toString()

        ## continue on if this is just a regex matching anything
        return if @isDefaultGrep(re)

        ## else if this isnt /.*/ we know the user has used a .only
        ## and we need to .....

        ## replace any single character except for digits,
        ## letters, [] or whitespaces
        re = re.replace /[^a-zA-Z0-9\[\]\s]/g, ""

        ## test the new re string against our testIdRegExp
        matches = testIdRegExp.exec(re)

        ## bail if this doesnt match what we expect
        return if not matches

        ## dont do anything if the matched id is our chosenId
        return if matches[1] is @get("chosenId")

        ## else if at this point if we have matches and its not
        ## our chosenId runnable, we need to unset what is currently
        ## chosenId and we need to choose this new runnable by its cid
        @unset "chosenId"

        return new RegExp @escapeId("[" + matches[1] + "]")

      isDefaultGrep: (str) ->
        str.toString() is "/.*/"

      escapeId: (id) ->
        id.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

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

        ## trigger the before run event
        @trigger "before:run"

        ## trigger this event if we're not using the default
        ## grep so we can remove existing tests
        @trigger "exclusive:test" if not @isDefaultGrep(@options.grep)

        ## shouldnt have to do this anymore since the tests and suites
        ## are rebuilt for each runner instance
        # @runner.tests = []

        ## we need to reset the runner.test to undefined
        ## when the user clicks the reload button, mocha
        ## will think that the currentTest is really the
        ## last test that was run.  so we always reset
        ## the state of the runner to prevent problems
        @runner.test = undefined

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
