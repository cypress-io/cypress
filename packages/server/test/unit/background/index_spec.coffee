require("../../spec_helper")

cp = require("child_process")

util = require("#{root}../lib/background/util")
background = require("#{root}../lib/background")

describe "lib/background/index", ->
  beforeEach ->
    background._reset()

    @backgroundProcess = {
      send: sinon.spy()
      on: sinon.stub()
      kill: sinon.spy()
    }
    sinon.stub(cp, "fork").returns(@backgroundProcess)

    @ipc = {
      send: sinon.spy()
      on: sinon.stub()
    }
    sinon.stub(util, "wrapIpc").returns(@ipc)

  context "#init", ->
    it "is noop if no backgroundFile", ->
      background.init({}) ## doesn't reject or time out

    it "forks child process", ->
      background.init({ backgroundFile: "background-file" })
      expect(cp.fork).to.be.called
      expect(cp.fork.lastCall.args[0]).to.contain("background/child/index.js")
      expect(cp.fork.lastCall.args[1]).to.eql(["--file", "background-file"])

    it "calls any handlers registered with the wrapped ipc", ->
      handler = sinon.spy()
      background.registerHandler(handler)
      background.init({ backgroundFile: "background-file" })
      expect(handler).to.be.called
      expect(handler.lastCall.args[0].send).to.be.a("function")
      expect(handler.lastCall.args[0].on).to.be.a("function")

    it "sends config via ipc", ->
      @ipc.on.withArgs("loaded").yields([])
      config = { backgroundFile: "background-file" }
      background.init(config).then =>
        expect(@ipc.send).to.be.calledWith("load", config)

    it "resolves once it receives 'loaded' message", ->
      @ipc.on.withArgs("loaded").yields([])
      ## should resolve and not time out
      background.init({ backgroundFile: "background-file" })

    it "kills child process if it already exists", ->
      @ipc.on.withArgs("loaded").yields([])
      background.init({ backgroundFile: "background-file" })
      .then =>
        background.init({ backgroundFile: "background-file" })
      .then =>
        expect(@backgroundProcess.kill).to.be.calledOnce

    it "errors when a renamed event is registered", ->
      @ipc.on.withArgs("loaded").yields({}, [{
        event: "file:preprocessor"
        eventId: 0
      }])
      background.init({ backgroundFile: "background-file" })
      .catch (err) =>
        expect(err.message).to.include("background event has been renamed")
        expect(err.message).to.include("`file:preprocessor` has been renamed to `browser:filePreprocessor`")
        expect(err.message).to.include("Background file location:")

    it "errors once when multiple renamed events are registered", ->
      @ipc.on.withArgs("loaded").yields({}, [{
        event: "file:preprocessor"
        eventId: 0
      },{
        event: "after:screenshot"
        eventId: 1
      },{
        event: "before:browser:launch"
        eventId: 2
      }])
      background.init({ backgroundFile: "background-file" })
      .catch (err) =>
        expect(err.message).to.include("background events have been renamed")
        expect(err.message).to.include("`file:preprocessor` has been renamed to `browser:filePreprocessor`")
        expect(err.message).to.include("`after:screenshot` has been renamed to `screenshot`")
        expect(err.message).to.include("`before:browser:launch` has been renamed to `browser:launch`")
        expect(err.message).to.include("Background file location:")

    describe "loaded message", ->
      beforeEach ->
        @config = {}

        @ipc.on.withArgs("loaded").yields(@config, [{
          event: "some:event"
          eventId: 0
        }])
        background.init({ backgroundFile: "background-file" })

      it "sends 'execute' message when event is executed, wrapped in promise", ->
        sinon.stub(util, "wrapParentPromise").resolves("value").yields("00")

        background.execute("some:event", "foo", "bar").then (value) =>
          expect(util.wrapParentPromise).to.be.called
          expect(@ipc.send).to.be.calledWith(
            "execute",
            "some:event",
            { eventId: 0, invocationId: "00" }
            ["foo", "bar"]
          )
          expect(value).to.equal("value")

    describe "load:error message", ->
      context "BACKGROUND_FILE_ERROR", ->
        beforeEach ->
          @ipc.on.withArgs("load:error").yields("BACKGROUND_FILE_ERROR", "path/to/backgroundFile.js", "error message stack")

        it "rejects background.init", ->
          background.init({ backgroundFile: "background-file" })
          .catch (err) =>
            expect(err.message).to.contain("The background file is missing or invalid")
            expect(err.message).to.contain("path/to/backgroundFile.js")
            expect(err.details).to.contain("error message stack")

      context "BACKGROUND_FUNCTION_ERROR", ->
        beforeEach ->
          @ipc.on.withArgs("load:error").yields("BACKGROUND_FUNCTION_ERROR", "path/to/backgroundFile.js", "error message stack")

        it "rejects background.init", ->
          background.init({ backgroundFile: "background-file" })
          .catch (err) =>
            expect(err.message).to.contain("The function exported by the background file threw an error.")
            expect(err.message).to.contain("path/to/backgroundFile.js")
            expect(err.details).to.contain("error message stack")

    describe "error message", ->
      beforeEach ->
        @err = {
          name: "error name"
          message: "error message"
        }
        @onError = sinon.spy()
        @ipc.on.withArgs("loaded").yields([])
        background.init({ backgroundFile: "background-file" }, { onError: @onError })

      it "kills the background process when background process errors", ->
        @backgroundProcess.on.withArgs("error").yield(@err)
        expect(@backgroundProcess.kill).to.be.called

      it "kills the background process when ipc sends error", ->
        @ipc.on.withArgs("error").yield(@err)
        expect(@backgroundProcess.kill).to.be.called

      it "calls onError when background process errors", ->
        @backgroundProcess.on.withArgs("error").yield(@err)
        expect(@onError).to.be.called
        expect(@onError.lastCall.args[0].title).to.equal("Error running background plugin")
        expect(@onError.lastCall.args[0].stack).to.include("The following error was thrown by a plugin in the background process")
        expect(@onError.lastCall.args[0].details).to.include(@err.message)

      it "calls onError when ipc sends error", ->
        @ipc.on.withArgs("error").yield(@err)
        expect(@onError).to.be.called
        expect(@onError.lastCall.args[0].title).to.equal("Error running background plugin")
        expect(@onError.lastCall.args[0].stack).to.include("The following error was thrown by a plugin in the background process")
        expect(@onError.lastCall.args[0].details).to.include(@err.message)

  context "#register", ->
    it "registers callback for event", ->
      foo = sinon.spy()
      background.init({ backgroundFile: "background-file" })
      background.register("foo", foo)
      background.execute("foo")
      expect(foo).to.be.called

    it "throws if event is not a string", ->
      expect(-> background.register()).to.throw("must be called with an event as its 1st argument")

    it "throws if callback is not a function", ->
      expect(-> background.register("foo")).to.throw("must be called with a callback function as its 2nd argument")

  context "#isRegistered", ->
    it "returns true when event has been registered", ->
      background.register("foo", ->)
      expect(background.isRegistered("foo")).to.be.true

    it "returns false when event has not been registered", ->
      expect(background.isRegistered("foo")).to.be.false

  context "#execute", ->
    it "calls the callback registered for the event if background process has been initialized", ->
      foo = sinon.spy()
      background.init({ backgroundFile: "background-file" })
      background.register("foo", foo)
      background.execute("foo", "arg1", "arg2")
      expect(foo).to.be.calledWith("arg1", "arg2")

    it "does not call the callback if background process has been initialized", ->
      foo = sinon.spy()
      background.register("foo", foo)
      background.execute("foo", "arg1", "arg2")
      expect(foo).not.to.be.called
