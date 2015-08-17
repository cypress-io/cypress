path    = require("path")
utils   = require("../../lib/utils")
Run     = require("../../lib/commands/run")

describe "Run", ->
  context "cli interface", ->
    beforeEach ->
      mockery.registerMock("./commands/run", @spy = @sandbox.spy())
      @parse = (args) ->
        program.parse("node test #{args}".split(" "))

    it "calls run with port", ->
      @parse("run --port 7878")
      expect(@spy).to.be.calledWith(undefined, {port: "7878"})

    it "calls run with port with -p arg", ->
      @parse("run 1234 -p 8989")
      expect(@spy).to.be.calledWith("1234", {port: "8989"})

  context "#constructor", ->
    beforeEach ->
      @spawn  = @sandbox.stub(utils, "spawn")

      @setup = (key, options = {}) ->
        Run(key, options)

    it "spawns --run-project with --ci and --key and xvfb", ->
      @setup(null, {port: "1234"})
      pathToProject = path.resolve(process.cwd(), ".")
      expect(@spawn).to.be.calledWith(["--run-project", pathToProject, "--port", "1234"])
