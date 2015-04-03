m = window.mocha

describe "Mocha API", ->
  afterEach ->
    ## only restore if we have a mocha instance!
    Cypress.Mocha.restore() if Cypress._mocha

    ## restore mocha global
    window.mocha = m

  context ".on('abort')", ->
    beforeEach ->
      Cypress.init()

    afterEach ->
      Cypress.stop()

    it "resets mocha grep to all", ->
      @sandbox.stub(Cypress, "getRunner").returns
        abort: ->
        destroy: ->

      Cypress.getMocha().grep /\w+/
      Cypress.trigger "abort"
      expect(Cypress.getMocha()._grep).to.match /.*/

  context ".getMocha", ->
    it "returns mocha instance", ->
      Cypress.Mocha.create()
      expect(Cypress.getMocha()).to.be.instanceof Mocha

    it "throws without mocha instance", ->

      expect(Cypress.getMocha).to.throw "Cypress._mocha instance not found!"

  context "#create", ->
    it "removes window.mocha", ->
      ## uhhhh for some reason deleting window.mocha
      ## then points to a reference of the DOM element
      ## with the id=mocha ??
      Cypress.Mocha.create()
      expect(window.mocha).not.to.have.property("run")

    it "assigns new mocha instance to Cypress._mocha", ->
      Cypress.Mocha.create()
      expect(Cypress._mocha).to.be.instanceof Mocha

    it "has an empty function as the reporter with arity 0", ->
      Cypress.Mocha.create()
      expect(Cypress._mocha._reporter.length).to.eq 0

    it "calls override", ->
      override = @sandbox.spy Cypress.Mocha, "override"
      Cypress.Mocha.create()
      expect(override).to.be.called

  context "#set", ->
    beforeEach ->
      Cypress.Mocha.create()

      @iframe = $("<iframe />").appendTo $("body")
      @contentWindow = @iframe.prop("contentWindow")

    afterEach ->
      @iframe.remove()

    it "sets Mocha", ->
      Cypress.Mocha.set @contentWindow
      expect(@contentWindow.Mocha).to.eq Mocha

    it "sets mocha", ->
      Cypress.Mocha.set @contentWindow
      expect(@contentWindow.mocha).to.eq Cypress.getMocha()

    it "calls removeAllListeners on mocha.suite", ->
      removeAllListeners = @sandbox.spy Cypress.getMocha().suite, "removeAllListeners"
      Cypress.Mocha.set @contentWindow
      expect(removeAllListeners).to.be.calledOnce

    it "clones and redefines mocha.suites", ->
      oldSuite = Cypress.getMocha().suite
      clone = @sandbox.spy oldSuite, "clone"
      Cypress.Mocha.set @contentWindow
      expect(clone).to.be.calledOnce
      expect(Cypress.getMocha().suite).not.to.eq oldSuite
      expect(Cypress.getMocha().suite).to.be.instanceof Mocha.Suite

    it "calls ui with 'bdd'", ->
      ui = @sandbox.spy Cypress.Mocha, "ui"
      Cypress.Mocha.set @contentWindow
      expect(ui).to.be.calledWith @contentWindow, "bdd"

    context "#ui", ->
      it "emits pre-require on mocha.suite", ->
        @contentWindow.mocha = Cypress.getMocha()
        Cypress.Mocha.clone @contentWindow

        emit = @sandbox.spy @contentWindow.mocha.suite, "emit"

        Cypress.Mocha.ui @contentWindow, "bdd"

        expect(emit).to.be.calledWith "pre-require", @contentWindow, null, @contentWindow.mocha

  context "#stop", ->
    beforeEach ->
      Cypress.Mocha.create()

    it "calls removeAllListeners from mocha suite", ->
      removeAllListeners = @sandbox.spy Cypress.getMocha().suite, "removeAllListeners"
      Cypress.Mocha.stop()
      expect(removeAllListeners).to.be.calledOnce

    it "nulls out mocha suite", ->
      mocha = Cypress.getMocha()
      Cypress.Mocha.stop()
      expect(mocha.suite).to.be.null

    it "delets Cypress._mocha", ->
      expect(Cypress._mocha).to.be.ok
      Cypress.Mocha.stop()
      expect(Cypress._mocha).to.be.undefined

  context "#restore", ->
    beforeEach ->
      Cypress.Mocha.create()

    it "calls #stop", ->
      stop = @sandbox.spy Cypress.Mocha, "stop"
      Cypress.Mocha.restore()
      expect(stop).to.be.calledOnce

  context "#override", ->

  context "#patchRunnerRun", ->

  context "#patchRunnerFail", ->

  context "#patchRunnableRun", ->