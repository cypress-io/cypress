path    = require("path")
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

  context "#constructor", ->
    beforeEach ->
      @spawn  = @sandbox.stub(utils, "spawn")
      @verify = @sandbox.stub(utils, "verifyCypressExists").resolves()

      @setup = (key, options = {}) ->
        options.initialize = false
        Ci(key, options).initialize(options)

    afterEach ->
      delete process.env.CYPRESS_CI_KEY

    it "spawns --run-project with --ci and --key and xvfb", ->
      @setup("abc12345").then =>
        pathToProject = path.resolve(process.cwd(), ".")
        expect(@spawn).to.be.calledWith(["--run-project", pathToProject, "--ci", "--key", "abc12345"], {xvfb: true})

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

    it "uses process.env.CYPRESS_CI_KEY when no key was passed", ->
      process.env.CYPRESS_CI_KEY = "987-654-321"
      @setup().then =>
        args = @spawn.getCall(0).args[0]
        expect(args).to.include("--key", "987-654-321")

    it "calls _noKeyErr when there isnt a key or env var", ->
      noKeyErr = @sandbox.stub(Ci.prototype, "_noKeyErr")
      @setup().then =>
        expect(noKeyErr).to.be.calledOnce

  context "#initialize", ->
    beforeEach ->
      @Ci = proxyquire("../lib/commands/ci", {
        "./run":     @Run     = @sandbox.stub()
        "./install": @Install = @sandbox.spy (opts) ->
          opts.after(opts)
      })

      @verify = @sandbox.stub(utils,  "verifyCypressExists").resolves()
      @log    = @sandbox.spy(console, "log")

      @setup = (key, options = {}) =>
        options.initialize = false
        @Ci(key, options)

    it "verifies cypress first", ->
      ci = @setup("abc123")
      ci.initialize().then =>
        expect(@verify).to.be.calledOnce

    it "installs cypress if verification failed", ->
      @verify.rejects()

      ci = @setup("abc123")
      ci.initialize({key: "abc123"}).then =>
        expect(@Install.getCall(0).args[0].displayOpen).to.be.false
        expect(@Install.getCall(0).args[0].after).to.be.a("function")
        expect(@Run).to.be.calledWithMatch(null, {key: "abc123"})

    it "logs out install message", ->
      @verify.rejects()

      ci = @setup("abc123")
      ci.initialize().then =>
        expect(@log).to.be.calledWithMatch("Cypress was not found:", "Installing a fresh copy.")

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
      expect(@log).to.be.calledWithMatch(/\w+/, "CYPRESS_CI_KEY")