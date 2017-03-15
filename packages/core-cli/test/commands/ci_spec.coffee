path    = require("path")
pkg     = require("../../package")
utils   = require("../../lib/utils")
Ci      = require("../../lib/commands/ci")

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

    it "calls ci with reporter options", ->
      @parse("ci abc123 --reporter-options mochaFile=result.xml")
      expect(@spy).to.be.calledWith("abc123", {reporterOptions: "mochaFile=result.xml"})

    it "calls with no key", ->
      @parse("ci")
      expect(@spy).to.be.calledWith(undefined)

    it "calls with no key and options", ->
      @parse("ci --reporter matrix")
      expect(@spy).to.be.calledWith(undefined, {reporter: "matrix"})

    it "calls with specific port", ->
      ## there is a bug where previous args are leaking
      ## into the program and building up state
      @parse("ci foobar --port 2121")
      expect(@spy).to.be.calledWithMatch("foobar", {port: "2121"})

    it "calls run with env variables", ->
      @parse("ci foobar --env foo=bar,host=http://localhost:8888")
      expect(@spy).to.be.calledWith("foobar", {env: "foo=bar,host=http://localhost:8888"})

    it "calls run with config", ->
      @parse("ci abc --config watchForFileChanges=false,baseUrl=localhost")
      expect(@spy).to.be.calledWith("abc", {config: "watchForFileChanges=false,baseUrl=localhost"})

    it "calls run with config when no ci key", ->
      @parse("ci -c watchForFileChanges=false,baseUrl=localhost")
      expect(@spy).to.be.calledWith(undefined, {config: "watchForFileChanges=false,baseUrl=localhost"})

    it "calls run with spec", ->
      @parse("ci myApp --spec cypress/integration/foo_spec.js")
      expect(@spy).to.be.calledWith("myApp", {spec: "cypress/integration/foo_spec.js"})

  context "#constructor", ->
    beforeEach ->
      @spawn  = @sandbox.stub(utils, "spawn")
      @verify = @sandbox.stub(utils, "verifyCypressExists").resolves()

      @setup = (key, options = {}) ->
        options.initialize = false
        Ci(key, options).initialize(options)

    afterEach ->
      delete process.env.CYPRESS_RECORD_KEY

    it "spawns --project with --ci and --key", ->
      @setup("abc12345").then =>
        pathToProject = path.resolve(process.cwd(), ".")
        expect(@spawn).to.be.calledWith(["--project", pathToProject, "--ci", "--record", true, "--key", "abc12345", "--cli-version", pkg.version])

    it "can pass a specific reporter", ->
      @setup("foo", {reporter: "some/custom/reporter.js"}).then =>
        pathToProject = path.resolve(process.cwd(), ".")
        args = @spawn.getCall(0).args[0]
        expect(args).to.include("--reporter", "some/custom/reporter.js")

    it "can pass a specific port", ->
      @setup("foo", {port: "2500"}).then =>
        pathToProject = path.resolve(process.cwd(), ".")
        args = @spawn.getCall(0).args[0]
        expect(args).to.include("--port", "2500")

    it "uses process.env.CYPRESS_RECORD_KEY when no key was passed", ->
      process.env.CYPRESS_RECORD_KEY = "987-654-321"
      @setup().then =>
        args = @spawn.getCall(0).args[0]
        expect(args).to.include("--key", "987-654-321")

    it "calls _noKeyErr when there isnt a key or env var", ->
      noKeyErr = @sandbox.stub(Ci.prototype, "_noKeyErr")
      @setup().then =>
        expect(noKeyErr).to.be.calledOnce

    it "spawns with config", ->
      @setup("abc123", {config: "watchForFileChanges=false,baseUrl=localhost"}).then =>
        pathToProject = path.resolve(process.cwd(), ".")
        expect(@spawn).to.be.calledWith(["--project", pathToProject, "--config", "watchForFileChanges=false,baseUrl=localhost", "--ci", "--record", true, "--key", "abc123", "--cli-version", pkg.version])

 context "#_noKeyErr", ->
    beforeEach ->
      @exit = @sandbox.stub(process, "exit")
      @log  = @sandbox.stub(console, "log")

      Ci.prototype._noKeyErr()

    it "calls process.exit(1)", ->
      expect(@exit).to.be.calledWith(1)

    it "logs error message", ->
      expect(@log).to.be.calledWithMatch("You did not pass a specific key to:", "cypress ci")
      expect(@log).to.be.calledWithMatch("Since no key was passed, we checked for an environment\nvariable but none was found with the name:", "CYPRESS_RECORD_KEY")
      expect(@log).to.be.calledWith("https://on.cypress.io/what-is-a-record-key")
