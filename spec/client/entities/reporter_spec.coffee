describe "Reporter Entity", ->
  beforeEach ->
    @reporter = App.request("reporter:entity")

  context "#run", ->
    beforeEach ->
      @setup   = @sandbox.stub Cypress, "setup"
      @run     = @sandbox.stub Cypress, "run"
      @trigger = @sandbox.spy @reporter, "trigger"

    it "triggers before:run", ->
      @reporter.run()
      expect(@trigger).to.be.calledWith "before:run"

    it "triggers before:run before calling Cypress.setup()", ->
      @reporter.run()
      expect(@setup).to.be.calledBefore(@run)

    it "triggers after:run as the Cypress.run callback", ->
      @run.callsArg(0)
      @reporter.run()
      expect(@trigger).to.be.calledWith "after:run"

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
      @abort = @sandbox.stub(Cypress, "abort").resolves()

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