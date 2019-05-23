require("../support/unit_spec_helper")

_ = require("lodash")
Promise = require("bluebird")
$Cypress = require("#{src}/cypress")

describe "src/cypress", ->
  beforeEach ->
    @Cypress = $Cypress.create()

  it ".extend", ->
    $Cypress.extend {foo: -> "foo"}
    expect(@Cypress.foo()).to.eq "foo"
    delete $Cypress.prototype.foo

  describe ".create", ->
    it "returns new Cypress instance", ->
      expect(@Cypress).to.be.instanceof $Cypress

    it "sets config", ->
      config = {foo: 'bar'}

      Cypress = $Cypress.create(config)

      expect(Cypress.config('foo')).to.eq('bar')

  describe "#constructor", ->
    it "nulls cy, chai, mocha, runner", ->
      _.each ["cy", "chai", "mocha", "runner"], (prop) =>
        expect(@Cypress[prop]).to.be.null

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
      @emit = @sandbox.spy @Cypress, "emit"

      @Cypress.runner = {}
      @Cypress.mocha = {options: @sandbox.spy()}
      @Cypress.initialize(1,2)

    it "emits 'initialize'", ->
      expect(@emit).to.be.calledWith "initialize", {
        specWindow: 1
        $autIframe: 2
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
        env: {foo: "bar"}
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

  describe "#setConfig", ->
    beforeEach ->
      @emit = @sandbox.spy @Cypress, "emit"

    it "instantiates env", ->
      expect(@Cypress.env).to.be.a("function")

    it "instantiates config", ->
      expect(@Cypress.config).to.be.a("function")

    it "instantiates Cookies", ->
      expect(@Cypress.Cookies).to.be.an("object")

    it "passes config.env", ->
      @Cypress.setConfig({
        env: {foo: "bar"}
      })

      expect(@Cypress.env()).to.deep.eq({foo: "bar"})

    it "emits 'config'", ->
      @Cypress.setConfig({foo: "bar"})
      expect(@emit).to.be.calledWith("config", {foo: "bar"})

    it "passes config to SetterGetter.create", ->
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

    it "sets version as a property", ->
      @Cypress.setConfig({version: "1.2.3"})
      expect(@Cypress.version).to.eq("1.2.3")

    it "sets isHeadless as a property", ->
      @Cypress.setConfig({})
      expect(@Cypress.isHeadless).to.be.false
      @Cypress.setConfig({isHeadless: true})
      expect(@Cypress.isHeadless).to.be.true

  describe "#onSpecWindow", ->
    beforeEach ->
      @specWindow = {}
      @cy = {
        onCommand: ->
        state: ->
      }

      @sandbox.stub($Cypress.prototype, "restore")
      @sandbox.stub($Cypress.Cy, "create").returns(@cy)

      _.each ["Chai", "Mocha", "Runner"], (klass) =>
        @sandbox.stub($Cypress[klass], "create").returns(klass)

    it "creates cy", ->
      expect(window.cy).to.be.undefined

      @Cypress.onSpecWindow(@specWindow)

      expect($Cypress.Cy.create).to.be.calledWith({})

      expect(window.cy).to.eq(@cy)

    it "creates chai", ->
      @Cypress.onSpecWindow(@specWindow)

      expect($Cypress.Chai.create).to.be.calledWith(@specWindow, @cy)

    it "creates mocha", ->
      @Cypress.onSpecWindow(@specWindow)

      expect($Cypress.Mocha.create).to.be.calledWith(@Cypress, {})

    it "creates runner", ->
      @Cypress.onSpecWindow(@specWindow)

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
      expect(@Cypress._).to.exist
      expect(@Cypress._.map).to.be.a("function")

  describe ".Blob", ->
    it "is a reference to blob util", ->
      expect(@Cypress.Blob).to.exist
      expect(@Cypress.Blob.createBlob).to.be.a("function")

  describe ".Promise", ->
    it "is a reference to Promise", ->
      expect(@Cypress.Promise).to.exist
      expect(@Cypress.Promise.resolve).to.be.a("function")

  describe ".minimatch", ->
    it "is a reference to minimatch function", ->
      expect(@Cypress.minimatch("/foo/bar/baz", "/foo/**")).to.be.true
