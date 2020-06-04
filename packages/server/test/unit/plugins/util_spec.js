require("../../spec_helper")

Promise = require("bluebird")

util = require("#{root}../lib/plugins/util")

describe "lib/plugins/util", ->

  context "#wrapIpc", ->
    beforeEach ->
      @theProcess = {
        send: sinon.spy()
        on: sinon.stub()
      }

      @ipc = util.wrapIpc(@theProcess)

    it "#send sends event through the process", ->
      @ipc.send("event-name", "arg1", "arg2")
      expect(@theProcess.send).to.be.calledWith({
        event: "event-name"
        args: ["arg1", "arg2"]
      })

    it "#send does not send if process has been killed", ->
      @theProcess.killed = true
      @ipc.send("event-name")
      expect(@theProcess.send).not.to.be.called

    it "#on listens for process messages that match event", ->
      handler = sinon.spy()
      @ipc.on("event-name", handler)
      @theProcess.on.yield({
        event: "event-name"
        args: ["arg1", "arg2"]
      })
      expect(handler).to.be.calledWith("arg1", "arg2")

    it "#removeListener emoves handler", ->
      handler = sinon.spy()
      @ipc.on("event-name", handler)
      @ipc.removeListener("event-name", handler)
      @theProcess.on.yield({
        event: "event-name"
        args: ["arg1", "arg2"]
      })
      expect(handler).not.to.be.called

  context "#wrapChildPromise", ->
    beforeEach ->
      @ipc = {
        send: sinon.spy()
        on: sinon.stub()
        removeListener: sinon.spy()
      }
      @invoke = sinon.stub()
      @ids = {
        eventId: 0
        invocationId: "00"
      }
      @args = []

    it "calls the invoke function with the callback id and args", ->
      util.wrapChildPromise(@ipc, @invoke, @ids).then =>
        expect(@invoke).to.be.calledWith(0, @args)

    it "wraps the invocation in a promise", ->
      @invoke.throws("some error") ## test that we're Promise.try-ing invoke
      expect(util.wrapChildPromise(@ipc, @invoke, @ids)).to.be.an.instanceOf(Promise)

    it "sends 'promise:fulfilled:{invocatationId}' with value when promise resolves", ->
      @invoke.resolves("value")
      util.wrapChildPromise(@ipc, @invoke, @ids).then =>
        expect(@ipc.send).to.be.calledWith("promise:fulfilled:00", null, "value")

    it "serializes undefined", ->
      @invoke.resolves(undefined)
      util.wrapChildPromise(@ipc, @invoke, @ids).then =>
        expect(@ipc.send).to.be.calledWith("promise:fulfilled:00", null, "__cypress_undefined__")

    it "sends 'promise:fulfilled:{invocatationId}' with error when promise rejects", ->
      err = new Error("fail")
      err.code = "ERM_DUN_FAILED"
      err.annotated = "annotated error"
      @invoke.rejects(err)
      util.wrapChildPromise(@ipc, @invoke, @ids).then =>
        expect(@ipc.send).to.be.calledWith("promise:fulfilled:00")
        actualError = @ipc.send.lastCall.args[1]
        expect(actualError.name).to.equal(err.name)
        expect(actualError.message).to.equal(err.message)
        expect(actualError.stack).to.equal(err.stack)
        expect(actualError.code).to.equal(err.code)
        expect(actualError.annotated).to.equal(err.annotated)

  context "#wrapParentPromise", ->
    beforeEach ->
      @ipc = {
        send: sinon.spy()
        on: sinon.stub()
        removeListener: sinon.spy()
      }
      @callback = sinon.spy()

    it "returns a promise", ->
      expect(util.wrapParentPromise(@ipc, 0, @callback)).to.be.an.instanceOf(Promise)

    it "resolves the promise when 'promise:fulfilled:{invocationId}' event is received without error", ->
      promise = util.wrapParentPromise(@ipc, 0, @callback)
      invocationId = @callback.lastCall.args[0]
      @ipc.on.withArgs("promise:fulfilled:#{invocationId}").yield(null, "value")
      promise.then (value) ->
        expect(value).to.equal("value")

    it "deserializes undefined", ->
      promise = util.wrapParentPromise(@ipc, 0, @callback)
      invocationId = @callback.lastCall.args[0]
      @ipc.on.withArgs("promise:fulfilled:#{invocationId}").yield(null, "__cypress_undefined__")
      promise.then (value) ->
        expect(value).to.equal(undefined)

    it "rejects the promise when 'promise:fulfilled:{invocationId}' event is received with error", ->
      promise = util.wrapParentPromise(@ipc, 0, @callback)
      invocationId = @callback.lastCall.args[0]
      err = {
        name: "the name"
        message: "the message"
        stack: "the stack"
      }
      @ipc.on.withArgs("promise:fulfilled:#{invocationId}").yield(err)
      promise.catch (actualErr) ->
        expect(actualErr).to.be.an.instanceOf(Error)
        expect(actualErr.name).to.equal(err.name)
        expect(actualErr.message).to.equal(err.message)
        expect(actualErr.stack).to.equal(err.stack)

    it "invokes callback with unique invocation id", ->
      firstCall = util.wrapParentPromise(@ipc, 0, @callback)
      invocationId = @callback.lastCall.args[0]
      @ipc.on.withArgs("promise:fulfilled:#{invocationId}").yield()
      firstCall.then =>
        expect(@callback).to.be.called
        firstId = @callback.lastCall.args[0]
        util.wrapParentPromise(@ipc, 0, @callback)
        secondId = @callback.lastCall.args[0]
        expect(firstId).not.to.equal(secondId)

    it "removes event listener once promise is fulfilled", ->
      promise = util.wrapParentPromise(@ipc, 0, @callback)
      invocationId = @callback.lastCall.args[0]
      @ipc.on.withArgs("promise:fulfilled:#{invocationId}").yield(null, "value")
      expect(@ipc.removeListener).to.be.calledWith("promise:fulfilled:#{invocationId}")

  context "#serializeError", ->
    it "sends error with name, message, stack, code, and annotated properties", ->
      err = {
        name: "the name"
        message: "the message"
        stack: "the stack"
        code: "the code"
        annotated: "the annotated version"
        extra: "this is extra"
      }
      expect(util.serializeError(err)).to.eql({
        name: "the name"
        message: "the message"
        stack: "the stack"
        code: "the code"
        annotated: "the annotated version"
      })
