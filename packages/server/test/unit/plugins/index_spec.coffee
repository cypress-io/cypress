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

  context "#init", ->
    it "is noop if no pluginsFile", ->
      plugins.init({}) ## doesn't reject

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
      config = { pluginsFile: "cypress-plugin" }
      plugins.init(config)
      expect(@pluginsProcess.send).to.be.calledWith({
        event: "load"
        args: [config]
      })

    it "resolves once it receives 'loaded' message", ->
      promise = plugins.init({ pluginsFile: "cypress-plugin" })
      @pluginsProcess.on.yield({
        event: "loaded"
        args: [[]]
      })
      ## should resolve and not time out
      return promise

    it "kills child process if it already exists", ->
      promise = plugins.init({ pluginsFile: "cypress-plugin" })
      .then =>
        p = plugins.init({ pluginsFile: "cypress-plugin" })

        @pluginsProcess.on.yield({
          event: "loaded"
          args: [[]]
        })

        return p
      .then =>
        expect(@pluginsProcess.kill).to.be.calledOnce

      @pluginsProcess.on.yield({
        event: "loaded"
        args: [[]]
      })

      return promise

    describe "loaded message", ->
      beforeEach ->
        promise = plugins.init({ pluginsFile: "cypress-plugin" })

        @pluginsProcess.on.yield({
          event: "loaded"
          args: [[{
            event: "some:event"
            callbackId: 0
          }]]
        })

        return promise

      it "sends 'execute' message when event is executed, wrapped in promise", ->
        @sandbox.stub(util, "wrapPromise").resolves("value").yields("00")

        plugins.execute("some:event", "foo", "bar").then (value) =>
          expect(util.wrapPromise).to.be.called
          expect(@pluginsProcess.send).to.be.calledWith({
            event: "execute"
            args: [
              "some:event"
              { callbackId: 0, invocationId: "00" }
              ["foo", "bar"]
            ]
          })
          expect(value).to.equal("value")

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
