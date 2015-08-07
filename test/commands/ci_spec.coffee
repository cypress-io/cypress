path   = require("path")
utils  = require("../../lib/utils")
Ci     = require("../../lib/commands/ci")

describe "Ci", ->
  context "cli interface", ->
    beforeEach ->
      mockery.registerMock("./commands/ci", @spy = @sandbox.spy())
      @parse = (args) ->
        program.parse("node test #{args}".split(" "))

    it "calls ci with key", ->
      @parse("ci abc123")
      expect(@spy).to.be.calledWith("abc123")

    it "calls ci with custom reporter", ->
      @parse("ci abc123 --reporter junit")
      expect(@spy).to.be.calledWith("abc123", {reporter: "junit"})

  context "#ci", ->
    beforeEach ->
      @spawn = @sandbox.stub(utils, "spawn")
      @setup = (key, options = {}) =>
        @ci = Ci(key, options)

    it "spawns --run-project with --ci and --key and xvfb", ->
      @setup("abc12345")
      pathToProject = path.resolve(process.cwd(), ".")
      expect(@spawn).to.be.calledWith(["--run-project", pathToProject, "--ci", "--key", "abc12345"], {xvfb: true})

    it "can pass a specific reporter", ->
      @setup("foo", {reporter: "some/custom/reporter.js"})
      pathToProject = path.resolve(process.cwd(), ".")
      args = @spawn.getCall(0).args[0]
      expect(args).to.include("--reporter", "some/custom/reporter.js")
