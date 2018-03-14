require("../../../spec_helper")

EE = require('events')

util = require("#{root}../../lib/plugins/util")
task = require("#{root}../../lib/plugins/child/task")

describe "lib/plugins/child/task", ->
  beforeEach ->
    @ipc = {
      send: @sandbox.spy()
      on: @sandbox.stub()
      removeListener: @sandbox.spy()
    }
    @callbacks = {
      "1": {
        "the:task": @sandbox.stub().returns("result")
      }
    }
    @ids = {}

    @sandbox.stub(util, "wrapChildPromise")


  it "passes through ipc and ids", ->
    task.wrap(@ipc, @callbacks, @ids, ["the:task"])
    expect(util.wrapChildPromise).to.be.called
    expect(util.wrapChildPromise.lastCall.args[0]).to.be.equal(@ipc)
    expect(util.wrapChildPromise.lastCall.args[2]).to.be.equal(@ids)

  it "invokes the callback for the given task if it exists and returns the result", ->
    task.wrap(@ipc, @callbacks, @ids, ["the:task", "the:arg"])
    result = util.wrapChildPromise.lastCall.args[1]("1", ["the:arg"])
    expect(@callbacks["1"]["the:task"]).to.be.calledWith("the:arg")
    expect(result).to.equal("result")

  it "returns __cypress_unhandled__ if the task doesn't exist", ->
    task.wrap(@ipc, @callbacks, @ids, ["nope"])
    expect(util.wrapChildPromise.lastCall.args[1]("1")).to.equal("__cypress_unhandled__")
