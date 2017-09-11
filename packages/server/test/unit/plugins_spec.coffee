require("../spec_helper")

plugins = require("#{root}lib/plugins")
nodeCache = require("#{root}lib/node_cache")

describe "lib/plugins", ->
  beforeEach ->
    plugins._reset()

  context "#init", ->
    beforeEach ->
      @sandbox.stub(nodeCache, "require").returns(->)
      @sandbox.stub(nodeCache, "has").returns(false)

    it "is noop if no pluginsFile", ->
      expect( -> plugins.init({})).not.to.throw()

    it "clears plugin from cache if already required", ->
      nodeCache.has.returns(true)
      @sandbox.stub(nodeCache, "clear")
      mockery.registerMock("cypress-plugin", ->)
      plugins.init({ pluginsFile: "cypress-plugin" })
      expect(nodeCache.clear).to.be.calledWith("cypress-plugin")

    it "requires pluginsFile via node cache", ->
      plugins.init({ pluginsFile: "cypress-plugin" })
      expect(nodeCache.require).to.be.calledWith("cypress-plugin")

    it "calls function exported by pluginsFile", ->
      plugin = @sandbox.spy()
      nodeCache.require.returns(plugin)
      config = { pluginsFile: "cypress-plugin" }
      plugins.init(config)
      expect(plugin).to.be.calledWith(plugins.register, config)

    it "throws error if pluginsFile is missing", ->
      nodeCache.require.throws({ code: "MODULE_NOT_FOUND" })
      expect(-> plugins.init({ pluginsFile: "cypress-plugin" })).to.throw("The plugins file is missing or invalid")

    it "throws error if requiring pluginsFile errors", ->
      ## path for substitute is relative to lib/plugins.coffee
      nodeCache.require.throws({ stack: "error thrown by pluginsFile" })
      expect(-> plugins.init({ pluginsFile: "cypress-plugin" })).to.throw("The plugins file is missing or invalid")
      expect(-> plugins.init({ pluginsFile: "cypress-plugin" })).to.throw("error thrown by pluginsFile")

    it "throws error if pluginsFile has syntax error", ->
      ## path for substitute is relative to lib/plugins.coffee
      nodeCache.require.throws({ stack: "Unexpected token" })
      expect(-> plugins.init({ pluginsFile: "cypress-plugin" })).to.throw("The plugins file is missing or invalid")
      expect(-> plugins.init({ pluginsFile: "cypress-plugin" })).to.throw("Unexpected token")

    it "throws error if pluginsFile does not export a function", ->
      nodeCache.require.returns(null)
      expect(-> plugins.init({ pluginsFile: "cypress-plugin" })).to.throw("The pluginsFile must export a function")

  context "#register", ->
    it "registers callback for event", ->
      foo = @sandbox.spy()
      plugins.register("foo", foo)
      plugins.execute("foo")
      expect(foo).to.be.called

    it "throws if event is not a string", ->
      expect(-> plugins.register()).to.throw("must be called with an event as its 1st argument")

    it "throws if callback is not a function", ->
      expect(-> plugins.register("foo")).to.throw("must be called with a callback function as its 2nd argument")

  context "#has", ->
    it "returns true when event has been registered", ->
      plugins.register("foo", ->)
      expect(plugins.has("foo")).to.be.true

    it "returns false when event has not been registered", ->
      expect(plugins.has("foo")).to.be.false

  context "#execute", ->
    it "calls the callback registered for the event", ->
      foo = @sandbox.spy()
      plugins.register("foo", foo)
      plugins.execute("foo", "arg1", "arg2")
      expect(foo).to.be.calledWith("arg1", "arg2")
