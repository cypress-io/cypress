utils      = require("../../lib/utils")
Install    = require("../../lib/commands/install")

describe "Update", ->
  context "cli interface", ->
    beforeEach ->
      mockery.registerMock("./commands/install", @spy = @sandbox.spy())
      @parse = (args) ->
        program.parse("node test #{args}".split(" "))

    it "calls install", ->
      @parse("update")
      expect(@spy).to.be.calledWith({})
