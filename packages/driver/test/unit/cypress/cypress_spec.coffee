{ _ } = window.testUtils

describe "$Cypress API", ->
  beforeEach ->
    @Cypress = $Cypress.create()

  afterEach ->
    @Cypress.stop()

  it ".extend", ->
    $Cypress.extend {foo: -> "foo"}
    expect(@Cypress.foo()).to.eq "foo"
    delete $Cypress.prototype.foo

  describe ".create", ->
    it "returns new Cypress instance", ->
      expect(@Cypress).to.be.instanceof $Cypress

    it "attaches klasses to $Cypress", ->
      klasses = "Cy Log Utils Chai Mocha Runner Agents Server Chainer Location LocalStorage".split(" ")
      for klass in klasses
        expect($Cypress[klass]).to.eq $Cypress[klass]

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
      @Cypress.initialize(1,2)

    it "triggers 'initialize'", ->
      expect(@trigger).to.be.calledWith "initialize", {
        specWindow: 1
        $remoteIframe: 2
      }

    it "calls mocha#options with runner", ->
      expect(@Cypress.mocha.options).to.be.calledWith {}

  describe "#run", ->
    it "throws when no runner", ->
      @Cypress.runner = null
      expect(=> @Cypress.run()).to.throw "Cannot call Cypress#run without a runner instance."

    it "passes the function to the runner#run", ->
      @fn = ->
      @Cypress.runner = { run: @sandbox.spy() }
      @Cypress.run @fn
      expect(@Cypress.runner.run).to.be.calledWith @fn

  describe "#env", ->
    beforeEach ->
      @Cypress.setConfig({
        environmentVariables: {foo: "bar"}
      })

    it "acts as getter", ->
      expect(@Cypress.env()).to.deep.eq({foo: "bar"})

    it "acts as getter with 1 string arg", ->
      expect(@Cypress.env("foo")).to.deep.eq("bar")

    it "acts as setter with key, value", ->
      @Cypress.env("bar", "baz")
      expect(@Cypress.env()).to.deep.eq({foo: "bar", bar: "baz"})

    it "acts as setter with object", ->
      @Cypress.env({bar: "baz"})
      expect(@Cypress.env()).to.deep.eq({foo: "bar", bar: "baz"})

    it "throws when Cypress.environmentVariables is undefined", ->
      delete @Cypress.environmentVariables

      fn = =>
        @Cypress.env()

      expect(fn).to.throw("Cypress.environmentVariables is not defined. Open an issue if you see this message.")

  describe "#setConfig", ->
    beforeEach ->
      @trigger = @sandbox.spy @Cypress, "trigger"

    it "instantiates EnvironmentVariables", ->
      expect(@Cypress).not.to.have.property("environmentVariables")
      @Cypress.setConfig({foo: "bar"})
      expect(@Cypress.environmentVariables).to.be.instanceof($Cypress.EnvironmentVariables)

    it "passes config.environmentVariables", ->
      @Cypress.setConfig({
        environmentVariables: {foo: "bar"}
      })

      expect(@Cypress.env()).to.deep.eq({foo: "bar"})

    it "triggers 'config'", ->
      @Cypress.setConfig({foo: "bar"})
      expect(@trigger).to.be.calledWith("config", {foo: "bar"})

    it "passes config to Config.create", ->
      @Cypress.setConfig({foo: "bar"})
      expect(@Cypress.config()).to.deep.eq({foo: "bar"})
      expect(@Cypress.config("foo")).to.eq("bar")

    it "can modify config values", ->
      @Cypress.setConfig({foo: "bar"})
      @Cypress.config("bar", "baz")
      expect(@Cypress.config()).to.deep.eq({foo: "bar", bar: "baz"})

    it "can set object literal as values", ->
      @Cypress.setConfig({foo: "bar"})
      @Cypress.config({foo: "baz", bar: "baz"})
      expect(@Cypress.config()).to.deep.eq({foo: "baz", bar: "baz"})

  describe "#setVersion", ->
    it "sets version on instance", ->
      @Cypress.setVersion("1.0.0")
      expect(@Cypress.version).to.equal("1.0.0")

  describe "#onSpecWindow", ->
    beforeEach ->
      @sandbox.stub($Cypress.prototype, "restore")
      @sandbox.stub($Cypress.Cy, "create").returns({
        onCommand: ->
        state: ->
      })
      _.each ["Chai", "Mocha", "Runner"], (klass) =>
        @sandbox.stub($Cypress[klass], "create").returns(klass)

      @Cypress.onSpecWindow({})

    it "creates cy", ->
      expect($Cypress.Cy.create).to.be.calledWith(@Cypress, {})

    it "creates chai", ->
      expect($Cypress.Chai.create).to.be.calledWith(@Cypress, {})

    it "creates mocha", ->
      expect($Cypress.Mocha.create).to.be.calledWith(@Cypress, {})

    it "creates runner", ->
      expect($Cypress.Runner.create).to.be.calledWith(@Cypress, {}, "Mocha")

  describe "#addParentCommand", ->
    it "throws deprecation", (done) ->
      fn = =>
        @Cypress.addParentCommand "foo", ->

      try
        fn()
      catch err
        expect(err.message).to.include("Cypress.addParentCommand(...) has been removed")
        expect(err.message).to.include("Cypress.Commands.add(...)")
        expect(err.message).to.include("Cypress.Commands.add('foo', function(){...}")
        expect(err.message).to.include("https://on.cypress.io/custom-command-interface-changed")
        done()

  describe "#addChildCommand", ->
    it "throws deprecation", (done) ->
      fn = =>
        @Cypress.addChildCommand "foo", ->

      try
        fn()
      catch err
        expect(err.message).to.include("Cypress.addChildCommand(...) has been removed")
        expect(err.message).to.include("Cypress.Commands.add(...)")
        expect(err.message).to.include("Cypress.Commands.add('foo', { prevSubject: true }, function(){...}")
        expect(err.message).to.include("https://on.cypress.io/custom-command-interface-changed")
        done()

  describe "#addDualCommand", ->
    it "throws deprecation", (done) ->
      fn = =>
        @Cypress.addDualCommand "foo", ->

      try
        fn()
      catch err
        expect(err.message).to.include("Cypress.addDualCommand(...) has been removed")
        expect(err.message).to.include("Cypress.Commands.add(...)")
        expect(err.message).to.include("Cypress.Commands.add('foo', { prevSubject: 'optional' }, function(){...}")
        expect(err.message).to.include("https://on.cypress.io/custom-command-interface-changed")
        done()

  describe "#addAssertionCommand", ->
    it "throws", (done) ->
      fn = =>
        @Cypress.addAssertionCommand "foo", ->

      try
        fn()
      catch err
        expect(err.message).to.eq("You cannot use the undocumented private command interface: addAssertionCommand")
        done()

  describe "#addUtilityCommand", ->
    it "throws", (done) ->
      fn = =>
        @Cypress.addUtilityCommand "foo", ->

      try
        fn()
      catch err
        expect(err.message).to.eq("You cannot use the undocumented private command interface: addUtilityCommand")
        done()

  describe ".$", ->
    it "proxies back to cy.$$", ->
      cy = {$$: @sandbox.spy()}
      @Cypress.cy = cy
      @Cypress.$("foo", "bar")
      expect(cy.$$).to.be.calledWith("foo", "bar")
      expect(cy.$$).to.be.calledOn(cy)

    it "proxies Deferred", (done) ->
      expect(@Cypress.$.Deferred).to.be.a("function")

      df = @Cypress.$.Deferred()

      _.delay ->
        df.resolve()
      , 10

      df.done -> done()

    _.each "Event Deferred ajax get getJSON getScript post when".split(" "), (fn) =>
      it "proxies $.#{fn}", ->
        expect(@Cypress.$[fn]).to.be.a("function")

  describe "._", ->
    it "is a reference to lodash", ->
      expect(@Cypress._).to.be.defined
      expect(@Cypress._.map).to.be.a("function")

  describe ".Blob", ->
    it "is a reference to blob util", ->
      expect(@Cypress.Blob).to.be.defined
      expect(@Cypress.Blob.createBlob).to.be.a("function")

  describe ".Promise", ->
    it "is a reference to Promise", ->
      expect(@Cypress.Promise).to.be.defined
      expect(@Cypress.Promise.resolve).to.be.a("function")

  describe ".minimatch", ->
    it "is a reference to minimatch function", ->
      expect(@Cypress.minimatch("/foo/bar/baz", "/foo/**")).to.be.true
