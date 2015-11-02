describe "Runner Entity", ->
  beforeEach ->
    @runner = App.request("runner:entity")
    @Cypress  = @runner.Cypress

  context "#initialize", ->
    it "listens to test:changed events and calls reRun", ->
      reRun = @sandbox.stub @runner, "reRun"

      ## need to reinitialize due to function reference
      @runner.initialize()
      socket = App.request "socket:entity"
      socket.trigger "test:changed", "entities/user_spec.coffee"

      expect(reRun).to.be.calledWith "entities/user_spec.coffee"

    it "listens to Cypress.initialized", ->
      receivedRunner = @sandbox.stub @runner, "receivedRunner"
      @Cypress.trigger "initialized", {runner: runner = {}}
      expect(receivedRunner).to.be.calledWith runner

    it "listens to Cypress.message", ->
      emit = @sandbox.stub @runner.socket, "emit"
      fn = @sandbox.stub()
      @Cypress.trigger "message", "create:user", {foo: "bar"}, fn
      expect(emit).to.be.calledWith "client:request", "create:user", {foo: "bar"}, fn

    it "listens to Cypress.fixture", ->
      emit = @sandbox.stub @runner.socket, "emit"
      fn = @sandbox.stub()
      @Cypress.trigger "fixture", "users/admin", fn
      expect(emit).to.be.calledWith "fixture", "users/admin", fn

    it "listens to Cypress.request", ->
      emit = @sandbox.stub @runner.socket, "emit"
      fn = @sandbox.stub()
      @Cypress.trigger "request", req = {url: "http://www.github.com/users"}, fn
      expect(emit).to.be.calledWith "request", req, fn

  context "#stop", ->
    beforeEach ->
      @stop = @sandbox.stub(@Cypress, "stop").resolves()

    it "calls #restore", ->
      restore = @sandbox.spy @runner, "restore"
      @runner.stop().then ->
        expect(restore).to.be.calledOnce

    it "stops listening", ->
      stopListening = @sandbox.spy @runner, "stopListening"
      @runner.stop().then ->
        expect(stopListening).to.be.calledOnce

    it "calls Cypress#stop", ->
      @runner.stop().then =>
        expect(@stop).to.be.calledOnce

  context "#restore", ->
    beforeEach ->
      @reset = @sandbox.stub @runner, "reset"

    it "calls reset", ->
      @runner.restore()
      expect(@reset).to.be.calledOnce

    it "nulls out references", ->
      refs = ["commands", "routes", "agents", "chosen", "specPath", "socket", "Cypress"]

      _.each refs, (ref) =>
        @runner[ref] = "foo"

      @runner.restore()

      _.each refs, (ref) =>
        expect(@runner[ref]).to.be.null

  context "#reset", ->
    it "calls reset on each collection", ->
      @resets = _.map ["commands", "routes", "agents"], (collection) =>
        @sandbox.spy @runner[collection], "reset"

      @runner.reset()

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

      @cyRunner     = $Cypress.Runner.runner(@Cypress, runner)
      @trigger      = @sandbox.spy @runner, "trigger"

      ## filter out other trigger events except for
      ## the test:add and suite:add
      @getAddEventCalls = ->
        _.filter @trigger.getCalls(), (call) ->
          /(test:add|suite:add)/.test call.args[0]

    it "triggers before:add", ->
      @runner.receivedRunner @cyRunner
      expect(@trigger).to.be.calledWith "before:add"

    it "triggers after:add", ->
      @runner.receivedRunner @cyRunner
      expect(@trigger).to.be.calledWith "after:add"

    describe "no chosen id", ->
      it "triggers add events, with runnable as 1st argument", ->
        @runner.set "chosenId", null, silent: true
        @runner.receivedRunner @cyRunner

        calls = @getAddEventCalls()

        ## there should be 1 call for each runnable
        expect(calls).to.have.length @cyRunner.runnables.length

        _.each @cyRunner.runnables, (runnable, index) ->
          expect(calls[index]).to.be.calledWith "#{runnable.type}:add", runnable

    describe "a chosen id", ->
      it "doesnt initially trigger add events", ->
        @runner.set "chosenId", 123, silent: true

        ## allow the first getRunnables call to pass
        ## through but then stub the rest
        @getRunnables = @cyRunner.getRunnables
        stub = @sandbox.stub @cyRunner, "getRunnables", ->
          if stub.callCount is 0
            @getRunnables.apply(@cyRunner, arguments)

        @runner.receivedRunner @cyRunner

        calls = @getAddEventCalls()
        expect(calls).to.have.length(0)

      context "when id is found", ->
        it "sets the grep on the runner", ->
          @runner.set "chosenId", "0a3", silent: true
          grep = @sandbox.spy @cyRunner, "grep"
          @runner.receivedRunner @cyRunner
          expect(grep).to.be.calledWith /\[0a3\]/

        it "triggers add events on matching grep'd tests", ->
          @runner.set "chosenId", "0a3", silent: true
          @runner.receivedRunner @cyRunner

          ## only suite1 and test two should be added
          ## because our chosenId grep's filters out
          ## the rest
          calls = @getAddEventCalls()
          expect(calls).to.have.length(2)

      context "when id isnt found", ->
        it "removes chosenId", ->
          @runner.set "chosenId", "abc", silent: true
          @runner.receivedRunner @cyRunner
          expect(@runner.get("chosenId")).to.be.undefined

        it "triggers add events", ->
          @runner.set "chosenId", "abc", silent: true
          @runner.receivedRunner @cyRunner
          calls = @getAddEventCalls()
          expect(calls).to.have.length(6)

        it "does not getRunnables again", ->
          @runner.set "chosenId", "abc", silent: true
          getRunnables = @sandbox.spy @cyRunner, "getRunnables"
          @runner.receivedRunner @cyRunner
          expect(getRunnables).to.be.calledOnce

  context "#getRunnableId", ->
    it "uses id from runnable title", ->
      r = {title: "foo bar baz [123]"}
      expect(@runner.getRunnableId(r)).to.eq "123"

    it "generates a random id if one doesnt exist", ->
      r = {title: "does not have an id"}
      id = @runner.getRunnableId(r)
      expect(id).to.be.ok
      expect(id).to.match /[a-zA-Z0-9]{3}/

  context "#createUniqueRunnableId", ->
    it "generates random ids until its unique", ->
      ids = ["123"]
      r = {title: "has a duplicate id [123]"}
      id = @runner.createUniqueRunnableId(r, ids)
      expect(id).to.be.ok
      expect(id).not.to.eq "123"
      expect(id).to.match /[a-zA-Z0-9]{3}/

    it "doesnt generate random ids if id is already unique", ->
      ids = ["123"]
      r = {title: "has id [456]"}
      id = @runner.createUniqueRunnableId(r, ids)
      expect(id).to.eq "456"

  context "#run", ->
    beforeEach ->
      @init    = @sandbox.stub @Cypress, "initialize"
      @run     = @sandbox.stub @Cypress, "run"
      @trigger = @sandbox.spy @runner, "trigger"

    it "triggers before:run", ->
      @runner.run()
      expect(@trigger).to.be.calledWith "before:run"

    it "triggers before:run before calling Cypress.initialize()", ->
      @runner.run()
      expect(@init).to.be.calledBefore(@run)

    it "triggers after:run as the Cypress.run callback", ->
      @run.callsArg(0)
      @runner.run()

      expect(@trigger).to.be.calledWith "after:run"

  context "#triggerLoadSpecFrame", ->
    beforeEach ->
      @trigger = @sandbox.spy(@runner, "trigger")

    # it "sets default options", ->
    #   attrs = {
    #     chosenId: 123
    #     browser: "chrome"
    #     version: 40
    #   }

    #   @runner.set attrs

    #   obj = {}

    #   @runner.triggerLoadSpecFrame "app_spec.coffee", obj

    #   expect(obj).to.deep.eq attrs

    it "calls #reset", ->
      reset = @sandbox.stub @runner, "reset"
      @runner.triggerLoadSpecFrame "app_spec.coffee"
      expect(reset).to.be.calledOnce

    # it "triggers 'load:spec:iframe' with specPath and options", ->
    #   options = {chosenId: "", browser: "", version: ""}
    #   @runner.triggerLoadSpecFrame "app_spec.coffee", options
    #   expect(@trigger).to.be.calledWith "load:spec:iframe", "app_spec.coffee", options

  context "#start", ->
    it "calls triggerLoadSpecFrame with specPath", ->
      triggerLoadSpecFrame = @sandbox.stub(@runner, "triggerLoadSpecFrame")
      @runner.start("app_spec.coffee")
      expect(triggerLoadSpecFrame).to.be.calledWith "app_spec.coffee"

    it "sets specPath", ->
      @runner.start("app_spec.coffee")
      expect(@runner.specPath).to.eq "app_spec.coffee"

    it "calls Cypress.start", ->
      start = @sandbox.spy @Cypress, "start"
      @runner.start("app_spec.coffee")
      expect(start).to.be.calledOnce

    it "calls Cypress.setConfig with app config", ->
      cfg = App.config.getCypressConfig()
      setConfig = @sandbox.spy @Cypress, "setConfig"
      @runner.start("app_spec.coffee")
      expect(setConfig).to.be.calledWith(cfg)

  context "#reRun", ->
    beforeEach ->
      @abort = @sandbox.stub(@Cypress, "abort").resolves()
      @runner.specPath = "app_spec.coffee"

    it "calls Cypress.abort()", ->
      @runner.reRun "app_spec.coffee"
      expect(@abort).to.be.calledOnce

    it "triggers 'reset:test:run'", ->
      trigger = @sandbox.spy(@runner, "trigger")
      @runner.reRun("app_spec.coffee").then ->
        expect(trigger).to.be.calledWith "reset:test:run"

    it "calls triggerLoadSpecFrame with specPath and options", ->
      triggerLoadSpecFrame = @sandbox.stub(@runner, "triggerLoadSpecFrame")
      @runner.reRun("app_spec.coffee", {foo: "bar"}).then ->
        expect(triggerLoadSpecFrame).to.be.calledWith "app_spec.coffee", {foo: "bar"}

    it "returns undefined if specPath doesnt match this.specPath", ->
      expect(@runner.reRun("foo_spec.coffee")).to.be.undefined

  context "#logResults", ->
    it "triggers 'test:results:ready'", ->
      trigger = @sandbox.spy @runner, "trigger"

      @runner.logResults({})
      expect(trigger).to.be.calledWith "test:results:ready", {}

  context "#setChosen", ->
    beforeEach ->
      @obj          = {id: 123}
      @reRun        = @sandbox.stub @runner, "reRun"
      @updateChosen = @sandbox.stub @runner, "updateChosen"

    it "sets chosen", ->
      @runner.setChosen @obj
      expect(@runner.chosen).to.eq @obj

    it "calls updateChosen with id", ->
      @runner.setChosen @obj
      expect(@updateChosen).to.be.calledWith 123

    it "calls reRun with @specPath", ->
      @runner.specPath = "app_spec.coffee"
      @runner.setChosen @obj
      expect(@reRun).to.be.calledWith "app_spec.coffee"

    it "sets chosen to null", ->
      @runner.setChosen()
      expect(@runner.chosen).to.be.null

    it "calls updateChosen with undefined", ->
      @runner.setChosen()
      expect(@updateChosen).to.be.calledWith undefined

  context "#updateChosen", ->
    it "sets chosenId", ->
      @runner.updateChosen 123
      expect(@runner.get("chosenId")).to.eq 123

    it "unsets chosenId", ->
      @runner.updateChosen 123
      @runner.updateChosen()
      expect(@runner.attributes).not.to.have.property("chosenId")

  context "#hasChosen", ->
    it "returns true", ->
      @runner.updateChosen 123
      expect(@runner.hasChosen()).to.be.true

    it "returns false", ->
      it "returns true", ->
        @runner.updateChosen 123
        @runner.updateChosen()
        expect(@runner.hasChosen()).to.be.false

  context "#getChosen", ->
    it "returns .chosen", ->
      @runner.chosen = {}
      expect(@runner.getChosen()).to.deep.eq {}