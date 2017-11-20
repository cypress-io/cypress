require("../../spec_helper")

cp = require("child_process")

util = require("#{root}../lib/plugins/util")
plugins = require("#{root}../lib/plugins")

describe "lib/plugins/index", ->
  beforeEach ->
    plugins._reset()

    @pluginsProcess = {
      send: @sandbox.spy()
      on: @sandbox.stub()
      kill: @sandbox.spy()
    }
    @sandbox.stub(cp, "fork").returns(@pluginsProcess)

    @ipc = {
      send: @sandbox.spy()
      on: @sandbox.stub()
    }
    @sandbox.stub(util, "wrapIpc").returns(@ipc)

  context "#init", ->
    it "is noop if no pluginsFile", ->
      plugins.init({}) ## doesn't reject or time out

    it "forks child process", ->
      plugins.init({ pluginsFile: "cypress-plugin" })
      expect(cp.fork).to.be.called
      expect(cp.fork.lastCall.args[0]).to.contain("plugins/child/index.js")
      expect(cp.fork.lastCall.args[1]).to.eql(["--file", "cypress-plugin"])

    it "calls any handlers registered with the wrapped ipc", ->
      handler = @sandbox.spy()
      plugins.registerHandler(handler)
      plugins.init({ pluginsFile: "cypress-plugin" })
      expect(handler).to.be.called
      expect(handler.lastCall.args[0].send).to.be.a("function")
      expect(handler.lastCall.args[0].on).to.be.a("function")

    it "sends config via ipc", ->
      @ipc.on.withArgs("loaded").yields([])
      config = { pluginsFile: "cypress-plugin" }
      plugins.init(config).then =>
        expect(@ipc.send).to.be.calledWith("load", config)

    it "resolves once it receives 'loaded' message", ->
      @ipc.on.withArgs("loaded").yields([])
      ## should resolve and not time out
      plugins.init({ pluginsFile: "cypress-plugin" })

    it "kills child process if it already exists", ->
      @ipc.on.withArgs("loaded").yields([])
      plugins.init({ pluginsFile: "cypress-plugin" })
      .then =>
        plugins.init({ pluginsFile: "cypress-plugin" })
      .then =>
        expect(@pluginsProcess.kill).to.be.calledOnce

    describe "loaded message", ->
      beforeEach ->
        @ipc.on.withArgs("loaded").yields([{
          event: "some:event"
          callbackId: 0
        }])
        plugins.init({ pluginsFile: "cypress-plugin" })

      it "sends 'execute' message when event is executed, wrapped in promise", ->
        @sandbox.stub(util, "wrapParentPromise").resolves("value").yields("00")

        plugins.execute("some:event", "foo", "bar").then (value) =>
          expect(util.wrapParentPromise).to.be.called
          expect(@ipc.send).to.be.calledWith(
            "execute",
            "some:event",
            { callbackId: 0, invocationId: "00" }
            ["foo", "bar"]
          )
          expect(value).to.equal("value")

    describe "error message", ->
      beforeEach ->
        @err = {
          name: "error name"
          message: "error message"
        }
        @onError = @sandbox.spy()
        @ipc.on.withArgs("loaded").yields([])
        plugins.init({ pluginsFile: "cypress-plugin" }, { onError: @onError })

      it "kills the plugins process when plugins process errors", ->
        @pluginsProcess.on.withArgs("error").yield(@err)
        expect(@pluginsProcess.kill).to.be.called

      it "kills the plugins process when ipc sends error", ->
        @ipc.on.withArgs("error").yield(@err)
        expect(@pluginsProcess.kill).to.be.called

      it "calls onError when plugins process errors", ->
        @pluginsProcess.on.withArgs("error").yield(@err)
        expect(@onError).to.be.called
        expect(@onError.lastCall.args[0].title).to.equal("Error running plugin")
        expect(@onError.lastCall.args[0].stack).to.include("The following error was thrown by a plugin")
        expect(@onError.lastCall.args[0].stack).to.include(@err.message)

      it "calls onError when ipc sends error", ->
        @ipc.on.withArgs("error").yield(@err)
        expect(@onError).to.be.called
        expect(@onError.lastCall.args[0].title).to.equal("Error running plugin")
        expect(@onError.lastCall.args[0].stack).to.include("The following error was thrown by a plugin")
        expect(@onError.lastCall.args[0].stack).to.include(@err.message)

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
