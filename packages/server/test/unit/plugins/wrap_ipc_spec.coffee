require("../../spec_helper")

wrapIpc = require("#{root}../lib/plugins/wrap_ipc")

describe "lib/plugins/wrap_ipc", ->
  beforeEach ->
    @theProcess = {
      send: @sandbox.spy()
      on: @sandbox.stub()
    }

    @ipc = wrapIpc(@theProcess)

  context "#send", ->
    it "sends event through the process", ->
      @ipc.send("event-name", "arg1", "arg2")
      expect(@theProcess.send).to.be.calledWith({
        event: "event-name"
        args: ["arg1", "arg2"]
      })

  context "#on", ->
    it "listens for process messages that match event", ->
      handler = @sandbox.spy()
      @ipc.on("event-name", handler)
      @theProcess.on.yield({
        event: "event-name"
        args: ["arg1", "arg2"]
      })
      expect(handler).to.be.calledWith("arg1", "arg2")

  context "#removeListener", ->
    it "removes handler", ->
      handler = @sandbox.spy()
      @ipc.on("event-name", handler)
      @ipc.removeListener("event-name", handler)
      @theProcess.on.yield({
        event: "event-name"
        args: ["arg1", "arg2"]
      })
      expect(handler).not.to.be.called
