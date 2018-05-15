require("../../../spec_helper")

EE = require('events')

util = require("#{root}../../lib/plugins/util")
task = require("#{root}../../lib/plugins/child/task")

describe "lib/plugins/child/task", ->
  beforeEach ->
    @ipc = {
      send: sinon.spy()
      on: sinon.stub()
      removeListener: sinon.spy()
    }
    @events = {
      "1": {
        event: "task"
        handler: {
          "the:task": sinon.stub().returns("result")
          "another:task": sinon.stub().returns("result")
          "a:third:task": -> "foo"
        }
      }
    }
    @ids = {}

    sinon.stub(util, "wrapChildPromise")

  context ".getBody", ->
    it "returns the stringified body of the event handler", ->
      task.getBody(@ipc, @events, @ids, ["a:third:task"])
      expect(util.wrapChildPromise).to.be.called
      result = util.wrapChildPromise.lastCall.args[1]("1")
      expect(result.replace(/\s+/g, '')).to.equal("function(){return\"foo\";}")

  context ".getKeys", ->
    it "returns the registered task keys", ->
      task.getKeys(@ipc, @events, @ids)
      expect(util.wrapChildPromise).to.be.called
      result = util.wrapChildPromise.lastCall.args[1]("1")
      expect(result).to.eql(["the:task", "another:task", "a:third:task"])

  context ".wrap", ->
    it "passes through ipc and ids", ->
      task.wrap(@ipc, @events, @ids, ["the:task"])
      expect(util.wrapChildPromise).to.be.called
      expect(util.wrapChildPromise.lastCall.args[0]).to.be.equal(@ipc)
      expect(util.wrapChildPromise.lastCall.args[2]).to.be.equal(@ids)

    it "invokes the callback for the given task if it exists and returns the result", ->
      task.wrap(@ipc, @events, @ids, ["the:task", "the:arg"])
      result = util.wrapChildPromise.lastCall.args[1]("1", ["the:arg"])
      expect(@events["1"].handler["the:task"]).to.be.calledWith("the:arg")
      expect(result).to.equal("result")

    it "returns __cypress_unhandled__ if the task doesn't exist", ->
      task.wrap(@ipc, @events, @ids, ["nope"])
      expect(util.wrapChildPromise.lastCall.args[1]("1")).to.equal("__cypress_unhandled__")
