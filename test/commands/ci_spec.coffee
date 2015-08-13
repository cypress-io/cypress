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

    it "calls with no key", ->
      @parse("ci")
      expect(@spy).to.be.calledWith(undefined)

    it "calls with no key and options", ->
      @parse("ci --reporter matrix")
      expect(@spy).to.be.calledWith(undefined, {reporter: "matrix"})

  context "#ci", ->
    beforeEach ->
      @spawn = @sandbox.stub(utils, "spawn")
      @setup = (key, options = {}) =>
        @ci = Ci(key, options)

    afterEach ->
      delete process.env.CYPRESS_API_KEY

    it "spawns --run-project with --ci and --key and xvfb", ->
      @setup("abc12345")
      pathToProject = path.resolve(process.cwd(), ".")
      expect(@spawn).to.be.calledWith(["--run-project", pathToProject, "--ci", "--key", "abc12345"], {xvfb: true})

    it "can pass a specific reporter", ->
      @setup("foo", {reporter: "some/custom/reporter.js"})
      pathToProject = path.resolve(process.cwd(), ".")
      args = @spawn.getCall(0).args[0]
      expect(args).to.include("--reporter", "some/custom/reporter.js")

    it "uses process.env.CYPRESS_API_KEY when no key was passed", ->
      process.env.CYPRESS_API_KEY = "987-654-321"
      @setup()
      args = @spawn.getCall(0).args[0]
      expect(args).to.include("--key", "987-654-321")

    it "calls _noKeyErr when there isnt a key or env var", ->
      noKeyErr = @sandbox.stub(Ci.prototype, "_noKeyErr")
      @setup()
      expect(noKeyErr).to.be.calledOnce

  context "#_noKeyErr", ->
    beforeEach ->
      @exit = @sandbox.stub(process, "exit")
      @log  = @sandbox.stub(console, "log")

      Ci.prototype._noKeyErr()

    it "calls process.exit(1)", ->
      expect(@exit).to.be.calledWith(1)

    it "logs error message", ->
      expect(@log).to.be.calledWithMatch("You did not pass a specific key to:", "cypress ci")
      expect(@log).to.be.calledWithMatch("You can receive your project's secret key by running", "cypress get:key")
      expect(@log).to.be.calledWith("Please provide us your project's secret key and then rerun.")

    it "logs the env key we checked for", ->
      expect(@log).to.be.calledWithMatch(/\w+/, "CYPRESS_API_KEY")