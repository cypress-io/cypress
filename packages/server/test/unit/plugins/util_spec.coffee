require("../../spec_helper")

Promise = require("bluebird")

util = require("#{root}../lib/plugins/util")

describe "lib/plugins/util", ->

  context "#wrapPromise", ->
    beforeEach ->
      @ipc = {
        send: @sandbox.spy()
        on: @sandbox.stub()
        removeListener: @sandbox.spy()
      }
      @callback = @sandbox.spy()

    it "returns a promise", ->
      expect(util.wrapPromise(@ipc, 0, @callback)).to.be.an.instanceOf(Promise)

    it "resolves the promise when 'promise:fulfilled:{invocationId}' event is received without error", ->
      promise = util.wrapPromise(@ipc, 0, @callback)
      invocationId = @callback.lastCall.args[0]
      @ipc.on.withArgs("promise:fulfilled:#{invocationId}").yield(null, "value")
      promise.then (value) ->
        expect(value).to.equal("value")

    it "rejects the promise when 'promise:fulfilled:{invocationId}' event is received with error", ->
      promise = util.wrapPromise(@ipc, 0, @callback)
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
      firstCall = util.wrapPromise(@ipc, 0, @callback)
      invocationId = @callback.lastCall.args[0]
      @ipc.on.withArgs("promise:fulfilled:#{invocationId}").yield()
      firstCall.then =>
        expect(@callback).to.be.called
        firstId = @callback.lastCall.args[0]
        util.wrapPromise(@ipc, 0, @callback)
        secondId = @callback.lastCall.args[0]
        expect(firstId).not.to.equal(secondId)

    it "removes event listener once promise is fulfilled", ->
      promise = util.wrapPromise(@ipc, 0, @callback)
      invocationId = @callback.lastCall.args[0]
      @ipc.on.withArgs("promise:fulfilled:#{invocationId}").yield(null, "value")
      expect(@ipc.removeListener).to.be.calledWith("promise:fulfilled:#{invocationId}")
