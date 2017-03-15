utils   = require("../../lib/utils")
install = require("../../lib/commands/install")

describe "Update", ->
  context "cli interface", ->
    beforeEach ->
      @sandbox.stub(install, "start")

      @parse = (args) ->
        program.parse("node test #{args}".split(" "))

    it "calls install", ->
      @parse("update")
      expect(install.start).to.be.calledWith({})
