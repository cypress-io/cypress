describe "$Cypress API", ->
  beforeEach ->
    ## back these up!
    @modules = $Cypress.modules

    $Cypress.reset()
    @Cypress = $Cypress.create()

  afterEach ->
    $Cypress.modules = @modules
    @Cypress.stop()

  it ".modules", ->
    expect($Cypress.modules).to.deep.eq {}

  it ".register", ->
    fn = ->
    $Cypress.register "foo", fn
    expect($Cypress.modules.foo).to.eq fn

  it ".remove", ->
    $Cypress.register "foo", ->
    $Cypress.remove "foo"
    expect($Cypress.modules).to.deep.eq {}

  it ".extend", ->
    $Cypress.extend {foo: -> "foo"}
    expect(@Cypress.foo()).to.eq "foo"
    delete $Cypress.prototype.foo

  describe ".create", ->
    it "returns new Cypress instance", ->
      expect(@Cypress).to.be.instanceof $Cypress

    it "attaches klasses to instance", ->
      klasses = "Cy Log Utils Chai Mocha Runner Agents Server Chainer Location LocalStorage".split(" ")
      for klass in klasses
        expect(@Cypress[klass]).to.eq $Cypress[klass]

  describe "#constructor", ->
    it "nulls cy, chai, mocha, runner", ->
      _.each ["cy", "chai", "mocha", "runner"], (prop) =>
        expect(@Cypress[prop]).to.be.null

    it "sets Cypress on the window", ->
      @Cypress.stop().then ->
        expect(window.Cypress).to.be.undefined
        Cypress = $Cypress.create()
        Cypress.start()
        expect(window.Cypress).to.eq Cypress

  describe "#loadModule", ->
    it "invokes module callback", (done) ->
      $Cypress.register "SomeCommand", (Cypress, _, $) =>
        expect(Cypress).to.eq @Cypress
        expect(_).to.be.ok
        expect($).to.be.ok
        done()

      @Cypress.loadModule "SomeCommand"

    it "throws when no module is found by name", ->
      fn = => @Cypress.loadModule("foo")

      expect(fn).to.throw "$Cypress.Module: foo not registered!"

  describe "#loadModules", ->
    beforeEach ->
      @loadModule = @sandbox.stub @Cypress, "loadModule"

    it "can loads modules by array of names", ->
      @Cypress.loadModules ["foo", "bar", "baz"]
      expect(@loadModule.firstCall).to.be.calledWith "foo"
      expect(@loadModule.secondCall).to.be.calledWith "bar"
      expect(@loadModule.thirdCall).to.be.calledWith "baz"

    it "can automatically load all modules", ->
      $Cypress.register "foo", ->
      $Cypress.register "bar", ->
      $Cypress.register "baz", ->
      @Cypress.loadModules()
      expect(@loadModule.firstCall).to.be.calledWith "foo"
      expect(@loadModule.secondCall).to.be.calledWith "bar"
      expect(@loadModule.thirdCall).to.be.calledWith "baz"

  describe "#stop", ->
    it "calls .abort()", ->
      abort = @sandbox.spy(@Cypress, "abort")
      @Cypress.stop().then ->
        expect(abort).to.be.called

    it "triggers stop", ->
      trigger = @sandbox.spy(@Cypress, "trigger")
      @Cypress.stop().then ->
        expect(trigger).to.be.calledWith "stop"

    it "unbinds all listeners", ->
      @Cypress.on "foo", ->
      expect(@Cypress._events).not.to.be.empty

      offFn = @sandbox.spy(@Cypress, "off")
      @Cypress.stop().then =>
        expect(offFn).to.be.calledOnce
        expect(@Cypress._events).to.be.empty

    it "deletes Cypress from the window", ->
      @Cypress.stop().then ->
        expect(window.Cypress).to.be.undefined

  describe "#abort", ->
    it "waits for all aborts to resolve", (done) ->
      aborted = false

      @Cypress.on "abort", ->
        Promise.resolve().then ->
          aborted = true

      @Cypress.abort().then ->
        expect(aborted).to.be.true
        done()

    it "calls #restore", ->
      restore = @sandbox.spy @Cypress, "restore"

      @Cypress.abort().then ->
        expect(restore).to.be.calledOnce

  describe "#initialize", ->
    beforeEach ->
      @trigger = @sandbox.spy @Cypress, "trigger"

      @Cypress.runner = {}
      @Cypress.mocha = {options: @sandbox.spy()}
      @Cypress.initialize(1,2,3)

    it "triggers 'initialize'", ->
      expect(@trigger).to.be.calledWith "initialize", {
        specWindow: 1
        $remoteIframe: 2
        config: 3
      }

    it "calls mocha#options with runner", ->
      expect(@Cypress.mocha.options).to.be.calledWith {}

  describe "#window", ->
    beforeEach ->
      _.each ["Cy", "Chai", "Mocha", "Runner"], (klass) =>
        @sandbox.stub(@Cypress[klass], "create").returns(klass)

      @Cypress.window({})

    it "creates cy", ->
      expect(@Cypress.Cy.create).to.be.calledWith(@Cypress, {})

    it "creates chai", ->
      expect(@Cypress.Chai.create).to.be.calledWith(@Cypress, {})

    it "creates mocha", ->
      expect(@Cypress.Mocha.create).to.be.calledWith(@Cypress, {})

    it "creates runner", ->
      expect(@Cypress.Runner.create).to.be.calledWith(@Cypress, {}, "Mocha")
