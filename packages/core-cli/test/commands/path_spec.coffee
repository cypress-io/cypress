path   = require("path")
utils  = require("../../lib/utils")
Path   = require("../../lib/commands/path")

describe "Path", ->
  context "cli interface", ->
    beforeEach ->
      mockery.registerMock("./commands/path", @spy = @sandbox.spy())
      @parse = (args) ->
        program.parse("node test #{args}".split(" "))

    it "calls path", ->
      @parse("get:path")
      expect(@spy).to.be.calledOnce

  context "#constructor", ->
    beforeEach ->
      @getCypressPath = @sandbox.stub(utils, "getCypressPath")

    it "calls getCypressPath", ->
      Path()
      expect(@getCypressPath).to.be.calledOnce