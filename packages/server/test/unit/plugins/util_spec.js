/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../../spec_helper");

const Promise = require("bluebird");

const util = require(`${root}../lib/plugins/util`);

describe("lib/plugins/util", function() {

  context("#wrapIpc", function() {
    beforeEach(function() {
      this.theProcess = {
        send: sinon.spy(),
        on: sinon.stub()
      };

      return this.ipc = util.wrapIpc(this.theProcess);
    });

    it("#send sends event through the process", function() {
      this.ipc.send("event-name", "arg1", "arg2");
      return expect(this.theProcess.send).to.be.calledWith({
        event: "event-name",
        args: ["arg1", "arg2"]
      });
    });

    it("#send does not send if process has been killed", function() {
      this.theProcess.killed = true;
      this.ipc.send("event-name");
      return expect(this.theProcess.send).not.to.be.called;
    });

    it("#on listens for process messages that match event", function() {
      const handler = sinon.spy();
      this.ipc.on("event-name", handler);
      this.theProcess.on.yield({
        event: "event-name",
        args: ["arg1", "arg2"]
      });
      return expect(handler).to.be.calledWith("arg1", "arg2");
    });

    return it("#removeListener emoves handler", function() {
      const handler = sinon.spy();
      this.ipc.on("event-name", handler);
      this.ipc.removeListener("event-name", handler);
      this.theProcess.on.yield({
        event: "event-name",
        args: ["arg1", "arg2"]
      });
      return expect(handler).not.to.be.called;
    });
  });

  context("#wrapChildPromise", function() {
    beforeEach(function() {
      this.ipc = {
        send: sinon.spy(),
        on: sinon.stub(),
        removeListener: sinon.spy()
      };
      this.invoke = sinon.stub();
      this.ids = {
        eventId: 0,
        invocationId: "00"
      };
      return this.args = [];});

    it("calls the invoke function with the callback id and args", function() {
      return util.wrapChildPromise(this.ipc, this.invoke, this.ids).then(() => {
        return expect(this.invoke).to.be.calledWith(0, this.args);
      });
    });

    it("wraps the invocation in a promise", function() {
      this.invoke.throws("some error"); //# test that we're Promise.try-ing invoke
      return expect(util.wrapChildPromise(this.ipc, this.invoke, this.ids)).to.be.an.instanceOf(Promise);
    });

    it("sends 'promise:fulfilled:{invocatationId}' with value when promise resolves", function() {
      this.invoke.resolves("value");
      return util.wrapChildPromise(this.ipc, this.invoke, this.ids).then(() => {
        return expect(this.ipc.send).to.be.calledWith("promise:fulfilled:00", null, "value");
      });
    });

    it("serializes undefined", function() {
      this.invoke.resolves(undefined);
      return util.wrapChildPromise(this.ipc, this.invoke, this.ids).then(() => {
        return expect(this.ipc.send).to.be.calledWith("promise:fulfilled:00", null, "__cypress_undefined__");
      });
    });

    return it("sends 'promise:fulfilled:{invocatationId}' with error when promise rejects", function() {
      const err = new Error("fail");
      err.code = "ERM_DUN_FAILED";
      err.annotated = "annotated error";
      this.invoke.rejects(err);
      return util.wrapChildPromise(this.ipc, this.invoke, this.ids).then(() => {
        expect(this.ipc.send).to.be.calledWith("promise:fulfilled:00");
        const actualError = this.ipc.send.lastCall.args[1];
        expect(actualError.name).to.equal(err.name);
        expect(actualError.message).to.equal(err.message);
        expect(actualError.stack).to.equal(err.stack);
        expect(actualError.code).to.equal(err.code);
        return expect(actualError.annotated).to.equal(err.annotated);
      });
    });
  });

  context("#wrapParentPromise", function() {
    beforeEach(function() {
      this.ipc = {
        send: sinon.spy(),
        on: sinon.stub(),
        removeListener: sinon.spy()
      };
      return this.callback = sinon.spy();
    });

    it("returns a promise", function() {
      return expect(util.wrapParentPromise(this.ipc, 0, this.callback)).to.be.an.instanceOf(Promise);
    });

    it("resolves the promise when 'promise:fulfilled:{invocationId}' event is received without error", function() {
      const promise = util.wrapParentPromise(this.ipc, 0, this.callback);
      const invocationId = this.callback.lastCall.args[0];
      this.ipc.on.withArgs(`promise:fulfilled:${invocationId}`).yield(null, "value");
      return promise.then(value => expect(value).to.equal("value"));
    });

    it("deserializes undefined", function() {
      const promise = util.wrapParentPromise(this.ipc, 0, this.callback);
      const invocationId = this.callback.lastCall.args[0];
      this.ipc.on.withArgs(`promise:fulfilled:${invocationId}`).yield(null, "__cypress_undefined__");
      return promise.then(value => expect(value).to.equal(undefined));
    });

    it("rejects the promise when 'promise:fulfilled:{invocationId}' event is received with error", function() {
      const promise = util.wrapParentPromise(this.ipc, 0, this.callback);
      const invocationId = this.callback.lastCall.args[0];
      const err = {
        name: "the name",
        message: "the message",
        stack: "the stack"
      };
      this.ipc.on.withArgs(`promise:fulfilled:${invocationId}`).yield(err);
      return promise.catch(function(actualErr) {
        expect(actualErr).to.be.an.instanceOf(Error);
        expect(actualErr.name).to.equal(err.name);
        expect(actualErr.message).to.equal(err.message);
        return expect(actualErr.stack).to.equal(err.stack);
      });
    });

    it("invokes callback with unique invocation id", function() {
      const firstCall = util.wrapParentPromise(this.ipc, 0, this.callback);
      const invocationId = this.callback.lastCall.args[0];
      this.ipc.on.withArgs(`promise:fulfilled:${invocationId}`).yield();
      return firstCall.then(() => {
        expect(this.callback).to.be.called;
        const firstId = this.callback.lastCall.args[0];
        util.wrapParentPromise(this.ipc, 0, this.callback);
        const secondId = this.callback.lastCall.args[0];
        return expect(firstId).not.to.equal(secondId);
      });
    });

    return it("removes event listener once promise is fulfilled", function() {
      const promise = util.wrapParentPromise(this.ipc, 0, this.callback);
      const invocationId = this.callback.lastCall.args[0];
      this.ipc.on.withArgs(`promise:fulfilled:${invocationId}`).yield(null, "value");
      return expect(this.ipc.removeListener).to.be.calledWith(`promise:fulfilled:${invocationId}`);
    });
  });

  return context("#serializeError", () => it("sends error with name, message, stack, code, and annotated properties", function() {
    const err = {
      name: "the name",
      message: "the message",
      stack: "the stack",
      code: "the code",
      annotated: "the annotated version",
      extra: "this is extra"
    };
    return expect(util.serializeError(err)).to.eql({
      name: "the name",
      message: "the message",
      stack: "the stack",
      code: "the code",
      annotated: "the annotated version"
    });
  }));
});
