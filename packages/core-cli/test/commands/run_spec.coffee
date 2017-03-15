path    = require("path")
pkg     = require("../../package")
utils   = require("../../lib/utils")
install = require("../../lib/commands/install")
run     = require("../../lib/commands/run")

describe "run", ->
  context "cli interface", ->
    beforeEach ->
      @sandbox.stub(run, "start")

      @parse = (args) ->
        program.parse("node test #{args}".split(" "))

    it "calls run with port", ->
      @parse("run --port 7878")
      expect(run.start).to.be.calledWith(undefined, {port: "7878"})

    it "calls run with spec", ->
      @parse("run myApp --spec cypress/integration/foo_spec.js")
      expect(run.start).to.be.calledWith("myApp", {spec: "cypress/integration/foo_spec.js"})

    it "calls run with port with -p arg", ->
      @parse("run 1234 -p 8989")
      expect(run.start).to.be.calledWith("1234", {port: "8989"})

    it "calls run with env variables", ->
      @parse("run myApp --env foo=bar,host=http://localhost:8888")
      expect(run.start).to.be.calledWith("myApp", {env: "foo=bar,host=http://localhost:8888"})

    it "calls run with config", ->
      @parse("run myApp --config watchForFileChanges=false,baseUrl=localhost")
      expect(run.start).to.be.calledWith("myApp", {config: "watchForFileChanges=false,baseUrl=localhost"})

    it "calls run with key", ->
      @parse("run --key asdf")
      expect(run.start).to.be.calledWith(undefined, {key: "asdf"})

    it "calls run with --record", ->
      @parse("run --record")
      expect(run.start).to.be.calledWith(undefined, {record: true})

    it "calls run with --record false", ->
      @parse("run --record false")
      expect(run.start).to.be.calledWith(undefined, {record: false})

  context ".start", ->
    beforeEach ->
      @spawn  = @sandbox.stub(utils, "spawn")

      @sandbox.stub(utils, "verifyCypressExists").resolves()

    it "spawns --project with --key and xvfb", ->
      pathToProject = path.resolve(process.cwd(), ".")

      run.start(null, {port: "1234"})
      .then =>
        expect(@spawn).to.be.calledWith(["--project", pathToProject, "--port", "1234", "--cli-version", pkg.version])

    it "spawns --project with --env", ->
      pathToProject = path.resolve(process.cwd(), ".")

      run.start(null, {env: "host=http://localhost:1337,name=brian"})
      .then =>
        expect(@spawn).to.be.calledWith(["--project", pathToProject, "--env", "host=http://localhost:1337,name=brian", "--cli-version", pkg.version])

    it "spawns --project with --config", ->
      pathToProject = path.resolve(process.cwd(), ".")

      run.start(null, {config: "watchForFileChanges=false,baseUrl=localhost"})
      .then =>
        expect(@spawn).to.be.calledWith(["--project", pathToProject, "--config", "watchForFileChanges=false,baseUrl=localhost", "--cli-version", pkg.version])

    it "spawns --project with --record false", ->
      pathToProject = path.resolve(process.cwd(), ".")

      run.start(null, {record: false})
      .then =>
        expect(@spawn).to.be.calledWith(["--project", pathToProject, "--record", false, "--cli-version", pkg.version])

  context ".run", ->
    beforeEach ->
      @sandbox.spy(install,  "start")
      @sandbox.stub(install, "download").resolves()
      @sandbox.stub(install, "unzip").resolves()
      @sandbox.stub(install, "cleanupZip").resolves()
      @sandbox.stub(install, "finishedInstalling")
      @sandbox.spy(console, "log")

      @spawn  = @sandbox.stub(utils, "spawn")
      @verify = @sandbox.stub(utils, "verifyCypressExists").resolves()

      @setup = (options = {}) =>
        run.start(null, options)

    it "verifies cypress first", ->
      @setup()
      .then =>
        expect(@verify).to.be.calledOnce

    it "installs cypress if verification failed", ->
      @verify.rejects()

      @setup()
      .then =>
        expect(install.start).to.be.calledWithMatch({displayOpen: false})
        expect(install.start.getCall(0).args[0].after).to.be.a("function")

    it "logs out install message", ->
      @verify.rejects()

      @setup()
      .then =>
        expect(console.log).to.be.calledWithMatch("Cypress was not found:", "Installing a fresh copy.")
