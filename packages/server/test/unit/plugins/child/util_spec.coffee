require("../../../spec_helper")

Promise = require("bluebird")

util = require("#{root}../../lib/plugins/child/util")

describe "lib/plugins/child/util", ->

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

  context "#wrapPromise", ->
    beforeEach ->
      @ipc = {
        send: @sandbox.spy()
        on: @sandbox.stub()
        removeListener: @sandbox.spy()
      }
      @invoke = @sandbox.stub()
      @ids = {
        callbackId: 0
        invocationId: "00"
      }
      @args = []

    it "calls the invoke function with the callback id and args", ->
      util.wrapPromise(@ipc, @invoke, @ids).then =>
        expect(@invoke).to.be.calledWith(0, @args)

    it "wraps the invocation in a promise", ->
      @invoke.throws("some error") ## test that we're Promise.try-ing invoke
      expect(util.wrapPromise(@ipc, @invoke, @ids)).to.be.an.instanceOf(Promise)

    it "sends 'promise:fulfilled:{invocatationId}' with value when promise resolves", ->
      @invoke.resolves("value")
      util.wrapPromise(@ipc, @invoke, @ids).then =>
        expect(@ipc.send).to.be.calledWith("promise:fulfilled:00", null, "value")

    it "sends 'promise:fulfilled:{invocatationId}' with error when promise rejects", ->
      err = new Error("fail")
      err.code = "ERM_DUN_FAILED"
      err.annotated = "annotated error"
      @invoke.rejects(err)
      util.wrapPromise(@ipc, @invoke, @ids).then =>
        expect(@ipc.send).to.be.calledWith("promise:fulfilled:00")
        actualError = @ipc.send.lastCall.args[1]
        expect(actualError.name).to.equal(err.name)
        expect(actualError.message).to.equal(err.message)
        expect(actualError.stack).to.equal(err.stack)
        expect(actualError.code).to.equal(err.code)
        expect(actualError.annotated).to.equal(err.annotated)
