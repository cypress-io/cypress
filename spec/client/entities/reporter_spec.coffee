describe "Reporter Entity", ->
  beforeEach ->
    @reporter = App.request("reporter:entity")
    @Cypress  = @reporter.Cypress

  context "#defaults", ->
    it "sets browser to null", ->
      expect(@reporter.get("browser")).to.be.null

    it "sets version to null", ->
      expect(@reporter.get("version")).to.be.null

  context "#initialize", ->
    it "listens to test:changed events and calls reRun", ->
      reRun = @sandbox.stub @reporter, "reRun"

      ## need to reinitialize due to function reference
      @reporter.initialize()
      socket = App.request "socket:entity"
      socket.trigger "test:changed", "entities/user_spec.coffee"

      expect(reRun).to.be.calledWith "entities/user_spec.coffee"

    it "listens to Cypress.initialized", ->
      receivedRunner = @sandbox.stub @reporter, "receivedRunner"
      @Cypress.trigger "initialized", {runner: runner = {}}
      expect(receivedRunner).to.be.calledWith runner

    it "listens to Cypress.message", ->
      emit = @sandbox.stub @reporter.socket, "emit"
      fn = @sandbox.stub()
      @Cypress.trigger "message", "create:user", {foo: "bar"}, fn
      expect(emit).to.be.calledWith "client:request", "create:user", {foo: "bar"}, fn

    it "listens to Cypress.url:changed", ->
      setUrl = @sandbox.spy App.config, "setUrl"
      @Cypress.trigger "url:changed", "http://localhost:3000/users/1"
      expect(setUrl).to.be.calledWith "http://localhost:3000/users/1"

    it.only "listens to Cypress.page:loading", ->
      setPageLoading = @sandbox.spy App.config, "setPageLoading"
      @Cypress.trigger "page:loading", true
      expect(setPageLoading).to.be.calledWith true

  context "#stop", ->
    beforeEach ->
      @stop = @sandbox.stub(@Cypress, "stop").resolves()

    it "calls #restore", ->
      restore = @sandbox.spy @reporter, "restore"
      @reporter.stop().then ->
        expect(restore).to.be.calledOnce

    it "stops listening", ->
      stopListening = @sandbox.spy @reporter, "stopListening"
      @reporter.stop().then ->
        expect(stopListening).to.be.calledOnce

    it "calls Cypress#stop", ->
      @reporter.stop().then =>
        expect(@stop).to.be.calledOnce

  context "#restore", ->
    beforeEach ->
      @reset = @sandbox.stub @reporter, "reset"

    it "calls reset", ->
      @reporter.restore()
      expect(@reset).to.be.calledOnce

    it "nulls out references", ->
      refs = ["commands", "routes", "agents", "chosen", "specPath", "socket", "Cypress"]

      _.each refs, (ref) =>
        @reporter[ref] = "foo"

      @reporter.restore()

      _.each refs, (ref) =>
        expect(@reporter[ref]).to.be.null

  context "#reset", ->
    it "calls reset on each collection", ->
      @resets = _.map ["commands", "routes", "agents"], (collection) =>
        @sandbox.spy @reporter[collection], "reset"

      @reporter.reset()

      _.each @resets, (reset) ->
        expect(reset).to.be.calledWithMatch [], {silent: true}

  context "#receivedRunner", ->
    beforeEach ->
      runner = Fixtures.createRunnables
        tests: ["one"]
        suites:
          "suite 1":
            tests: ["suite 1, two [0a3]", "suite 1, three"]
            suites:
              "suite 2":
                tests: ["suite 2, four"]

      @runner       = $Cypress.Runner.runner(@Cypress, runner)
      @trigger      = @sandbox.spy @reporter, "trigger"

      ## filter out other trigger events except for
      ## the test:add and suite:add
      @getAddEventCalls = ->
        _.filter @trigger.getCalls(), (call) ->
          /(test:add|suite:add)/.test call.args[0]

    it "triggers before:add", ->
      @reporter.receivedRunner @runner
      expect(@trigger).to.be.calledWith "before:add"

    it "triggers after:add", ->
      @reporter.receivedRunner @runner
      expect(@trigger).to.be.calledWith "after:add"

    describe "no chosen id", ->
      it "triggers add events, with runnable as 1st argument", ->
        @reporter.set "chosenId", null, silent: true
        @reporter.receivedRunner @runner

        calls = @getAddEventCalls()

        ## there should be 1 call for each runnable
        expect(calls).to.have.length @runner.runnables.length

        _.each @runner.runnables, (runnable, index) ->
          expect(calls[index]).to.be.calledWith "#{runnable.type}:add", runnable

    describe "a chosen id", ->
      it "doesnt initially trigger add events", ->
        @reporter.set "chosenId", 123, silent: true

        ## allow the first getRunnables call to pass
        ## through but then stub the rest
        @getRunnables = @runner.getRunnables
        stub = @sandbox.stub @runner, "getRunnables", ->
          if stub.callCount is 0
            @getRunnables.apply(@runner, arguments)

        @reporter.receivedRunner @runner

        calls = @getAddEventCalls()
        expect(calls).to.have.length(0)

      context "when id is found", ->
        it "sets the grep on the runner", ->
          @reporter.set "chosenId", "0a3", silent: true
          grep = @sandbox.spy @runner, "grep"
          @reporter.receivedRunner @runner
          expect(grep).to.be.calledWith /\[0a3\]/

        it "triggers add events on matching grep'd tests", ->
          @reporter.set "chosenId", "0a3", silent: true
          @reporter.receivedRunner @runner

          ## only suite1 and test two should be added
          ## because our chosenId grep's filters out
          ## the rest
          calls = @getAddEventCalls()
          expect(calls).to.have.length(2)

      context "when id isnt found", ->
        it "removes chosenId", ->
          @reporter.set "chosenId", "abc", silent: true
          @reporter.receivedRunner @runner
          expect(@reporter.get("chosenId")).to.be.undefined

        it "triggers add events", ->
          @reporter.set "chosenId", "abc", silent: true
          @reporter.receivedRunner @runner
          calls = @getAddEventCalls()
          expect(calls).to.have.length(6)

        it "does not getRunnables again", ->
          @reporter.set "chosenId", "abc", silent: true
          getRunnables = @sandbox.spy @runner, "getRunnables"
          @reporter.receivedRunner @runner
          expect(getRunnables).to.be.calledOnce

  context "#getRunnableId", ->
    it "uses id from runnable title", ->
      r = {title: "foo bar baz [123]"}
      expect(@reporter.getRunnableId(r)).to.eq "123"

    it "generates a random id if one doesnt exist", ->
      r = {title: "does not have an id"}
      id = @reporter.getRunnableId(r)
      expect(id).to.be.ok
      expect(id).to.match /[a-zA-Z0-9]{3}/

  context "#createUniqueRunnableId", ->
    it "generates random ids until its unique", ->
      ids = ["123"]
      r = {title: "has a duplicate id [123]"}
      id = @reporter.createUniqueRunnableId(r, ids)
      expect(id).to.be.ok
      expect(id).not.to.eq "123"
      expect(id).to.match /[a-zA-Z0-9]{3}/

    it "doesnt generate random ids if id is already unique", ->
      ids = ["123"]
      r = {title: "has id [456]"}
      id = @reporter.createUniqueRunnableId(r, ids)
      expect(id).to.eq "456"

  context "#run", ->
    beforeEach ->
      @init    = @sandbox.stub @Cypress, "initialize"
      @run     = @sandbox.stub @Cypress, "run"
      @trigger = @sandbox.spy @reporter, "trigger"

    it "triggers before:run", ->
      @reporter.run()
      expect(@trigger).to.be.calledWith "before:run"

    it "triggers before:run before calling Cypress.initialize()", ->
      @reporter.run()
      expect(@init).to.be.calledBefore(@run)

    it "triggers after:run as the Cypress.run callback", ->
      @run.callsArg(0)
      @reporter.run()

      expect(@trigger).to.be.calledWith "after:run"

    it "calls App.config.run() before run", ->
      configRun = @sandbox.spy App.config, "run"

      @reporter.run()
      expect(configRun).to.be.calledOnce

    it "calls App.config.run(false) after run", ->
      configRun = @sandbox.spy App.config, "run"

      @run.callsArg(0)
      @reporter.run()
      expect(configRun).to.be.calledWith(false)

  context "#triggerLoadSpecFrame", ->
    beforeEach ->
      @trigger = @sandbox.spy(@reporter, "trigger")

    it "sets default options", ->
      attrs = {
        chosenId: 123
        browser: "chrome"
        version: 40
      }

      @reporter.set attrs

      obj = {}

      @reporter.triggerLoadSpecFrame "app_spec.coffee", obj

      expect(obj).to.deep.eq attrs

    it "calls #reset", ->
      reset = @sandbox.stub @reporter, "reset"
      @reporter.triggerLoadSpecFrame "app_spec.coffee"
      expect(reset).to.be.calledOnce

    it "triggers 'load:spec:iframe' with specPath and options", ->
      options = {chosenId: "", browser: "", version: ""}
      @reporter.triggerLoadSpecFrame "app_spec.coffee", options
      expect(@trigger).to.be.calledWith "load:spec:iframe", "app_spec.coffee", options

  context "#start", ->
    it "calls triggerLoadSpecFrame with specPath", ->
      triggerLoadSpecFrame = @sandbox.stub(@reporter, "triggerLoadSpecFrame")
      @reporter.start("app_spec.coffee")
      expect(triggerLoadSpecFrame).to.be.calledWith "app_spec.coffee"

    it "sets specPath", ->
      @reporter.start("app_spec.coffee")
      expect(@reporter.specPath).to.eq "app_spec.coffee"

  context "#reRun", ->
    beforeEach ->
      @abort = @sandbox.stub(@Cypress, "abort").resolves()
      @reporter.specPath = "app_spec.coffee"

    it "calls Cypress.abort()", ->
      @reporter.reRun "app_spec.coffee"
      expect(@abort).to.be.calledOnce

    it "triggers 'reset:test:run'", ->
      trigger = @sandbox.spy(@reporter, "trigger")
      @reporter.reRun("app_spec.coffee").then ->
        expect(trigger).to.be.calledWith "reset:test:run"

    it "calls triggerLoadSpecFrame with specPath and options", ->
      triggerLoadSpecFrame = @sandbox.stub(@reporter, "triggerLoadSpecFrame")
      @reporter.reRun("app_spec.coffee", {foo: "bar"}).then ->
        expect(triggerLoadSpecFrame).to.be.calledWith "app_spec.coffee", {foo: "bar"}

    it "returns undefined if specPath doesnt match this.specPath", ->
      expect(@reporter.reRun("foo_spec.coffee")).to.be.undefined

  context "#logResults", ->
    it "triggers 'test:results:ready'", ->
      trigger = @sandbox.spy @reporter, "trigger"

      @reporter.logResults({})
      expect(trigger).to.be.calledWith "test:results:ready", {}

  context "#setChosen", ->
    beforeEach ->
      @obj          = {id: 123}
      @reRun        = @sandbox.stub @reporter, "reRun"
      @updateChosen = @sandbox.stub @reporter, "updateChosen"

    it "sets chosen", ->
      @reporter.setChosen @obj
      expect(@reporter.chosen).to.eq @obj

    it "calls updateChosen with id", ->
      @reporter.setChosen @obj
      expect(@updateChosen).to.be.calledWith 123

    it "calls reRun with @specPath", ->
      @reporter.specPath = "app_spec.coffee"
      @reporter.setChosen @obj
      expect(@reRun).to.be.calledWith "app_spec.coffee"

    it "sets chosen to null", ->
      @reporter.setChosen()
      expect(@reporter.chosen).to.be.null

    it "calls updateChosen with undefined", ->
      @reporter.setChosen()
      expect(@updateChosen).to.be.calledWith undefined

  context "#updateChosen", ->
    it "sets chosenId", ->
      @reporter.updateChosen 123
      expect(@reporter.get("chosenId")).to.eq 123

    it "unsets chosenId", ->
      @reporter.updateChosen 123
      @reporter.updateChosen()
      expect(@reporter.attributes).not.to.have.property("chosenId")

  context "#hasChosen", ->
    it "returns true", ->
      @reporter.updateChosen 123
      expect(@reporter.hasChosen()).to.be.true

    it "returns false", ->
      it "returns true", ->
        @reporter.updateChosen 123
        @reporter.updateChosen()
        expect(@reporter.hasChosen()).to.be.false

  context "#getChosen", ->
    it "returns .chosen", ->
      @reporter.chosen = {}
      expect(@reporter.getChosen()).to.deep.eq {}