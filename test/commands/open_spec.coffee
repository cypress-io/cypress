path   = require("path")
utils  = require("../../lib/utils")
Open   = require("../../lib/commands/open")

describe "Open", ->
  context "cli interface", ->
    beforeEach ->
      mockery.registerMock("./commands/open", @spy = @sandbox.spy())
      @parse = (args) ->
        program.parse("node test #{args}".split(" "))

    it "calls open", ->
      @parse("open")
      expect(@spy).to.be.calledOnce

  context "#constructor", ->
    beforeEach ->
      @spawn = @sandbox.stub(utils, "spawn")

    it "calls spawn with correct options", ->
      Open()
      expect(@spawn).to.be.calledWith(null, {
        xvfb: false
        detached: true
        stdio: ["ignore", "ignore", "ignore"]
      })