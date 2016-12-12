require("../spec_helper")

_        = require("lodash")
os       = require("os")
cp       = require("child_process")
path     = require("path")
http     = require("http")
Promise  = require("bluebird")
electron = require("electron")
inquirer = require("inquirer")
extension = require("@cypress/core-extension")
Fixtures = require("../helpers/fixtures")
pkg      = require("#{root}package.json")
bundle   = require("#{root}lib/util/bundle")
settings = require("#{root}lib/util/settings")
Events   = require("#{root}lib/electron/handlers/events")
project  = require("#{root}lib/electron/handlers/project")
Renderer = require("#{root}lib/electron/handlers/renderer")
ci       = require("#{root}lib/modes/ci")
headed   = require("#{root}lib/modes/headed")
headless = require("#{root}lib/modes/headless")
api      = require("#{root}lib/api")
user     = require("#{root}lib/user")
config   = require("#{root}lib/config")
cache    = require("#{root}lib/cache")
errors   = require("#{root}lib/errors")
cypress  = require("#{root}lib/cypress")
Project  = require("#{root}lib/project")
Server   = require("#{root}lib/server")
Reporter = require("#{root}lib/reporter")
launcher = require("#{root}lib/launcher")
Watchers = require("#{root}lib/watchers")

describe "lib/cypress", ->
  beforeEach ->
    cache.removeSync()

    Fixtures.scaffold()
    @todosPath    = Fixtures.projectPath("todos")
    @pristinePath = Fixtures.projectPath("pristine")
    @idsPath      = Fixtures.projectPath("ids")

    ## force cypress to call directly into main without
    ## spawning a separate process
    @sandbox.stub(cypress, "isCurrentlyRunningElectron").returns(true)
    @sandbox.stub(extension, "setHostAndPath").resolves()
    @sandbox.stub(launcher, "getBrowsers").resolves([])
    @sandbox.stub(process, "exit")
    @sandbox.spy(errors, "log")

    @expectExitWith = (code) =>
      expect(process.exit).to.be.calledWith(code)

    @expectExitWithErr = (type, msg) ->
      expect(errors.log).to.be.calledWithMatch({type: type})
      expect(process.exit).to.be.calledWith(1)
      if msg
        err = errors.log.getCall(0).args[0]
        expect(err.message).to.include(msg)

  afterEach ->
    Fixtures.remove()

    ## make sure every project
    ## we spawn is closed down
    project.close()

  context "--get-key", ->
    it "writes out key and exits on success", ->
      Promise.all([
        user.set({name: "brian", sessionToken: "session-123"}),

        Project.add(@todosPath)
        .then =>
          Project.id(@todosPath)
        .then (id) =>
          @projectId = id
      ])
      .then =>
        @sandbox.spy(console, "log")
        @sandbox.stub(api, "getProjectToken")
          .withArgs(@projectId, "session-123")
          .resolves("new-key-123")

        cypress.start(["--get-key", "--project=#{@todosPath}"])
      .then =>
        expect(console.log).to.be.calledWith("new-key-123")
        @expectExitWith(0)

    it "logs error and exits when user isn't logged in", ->
      user.set({})
      .then =>
        cypress.start(["--get-key", "--project=#{@todosPath}"])
      .then =>
        @expectExitWithErr("NOT_LOGGED_IN")

    it "logs error and exits when project does not have an id", ->
      user.set({sessionToken: "session-123"})
      .then =>
        cypress.start(["--get-key", "--project=#{@pristinePath}"])
      .then =>
        @expectExitWithErr("NO_PROJECT_ID", @pristinePath)

    it "logs error and exits when project could not be found at the path", ->
      user.set({sessionToken: "session-123"})
      .then =>
        cypress.start(["--get-key", "--project=path/to/no/project"])
      .then =>
        @expectExitWithErr("NO_PROJECT_FOUND_AT_PROJECT_ROOT", "path/to/no/project")

    it "logs error and exits when project token cannot be fetched", ->
      Promise.all([
        user.set({sessionToken: "session-123"}),

        Project.add(@todosPath)
        .then =>
          Project.id(@todosPath)
        .then (id) =>
          @projectId = id
      ])
      .then =>
        @sandbox.stub(api, "getProjectToken")
          .withArgs(@projectId, "session-123")
          .rejects(new Error)

        cypress.start(["--get-key", "--project=#{@todosPath}"])
      .then =>
        @expectExitWithErr("CANNOT_FETCH_PROJECT_TOKEN")

  context "--new-key", ->
    it "writes out key and exits on success", ->
      Promise.all([
        user.set({name: "brian", sessionToken: "session-123"}),

        Project.add(@todosPath)
        .then =>
          Project.id(@todosPath)
        .then (id) =>
          @projectId = id
      ])
      .then =>
        @sandbox.spy(console, "log")
        @sandbox.stub(api, "updateProjectToken")
          .withArgs(@projectId, "session-123")
          .resolves("new-key-123")

        cypress.start(["--new-key", "--project=#{@todosPath}"])
      .then =>
        expect(console.log).to.be.calledWith("new-key-123")
        @expectExitWith(0)

    it "logs error and exits when user isn't logged in", ->
      user.set({})
      .then =>
        cypress.start(["--new-key", "--project=#{@todosPath}"])
      .then =>
        @expectExitWithErr("NOT_LOGGED_IN")

    it "logs error and exits when project does not have an id", ->
      user.set({sessionToken: "session-123"})
      .then =>
        cypress.start(["--new-key", "--project=#{@pristinePath}"])
      .then =>
        @expectExitWithErr("NO_PROJECT_ID", @pristinePath)

    it "logs error and exits when project could not be found at the path", ->
      user.set({sessionToken: "session-123"})
      .then =>
        cypress.start(["--new-key", "--project=path/to/no/project"])
      .then =>
        @expectExitWithErr("NO_PROJECT_FOUND_AT_PROJECT_ROOT", "path/to/no/project")

    it "logs error and exits when project token cannot be fetched", ->
      Promise.all([
        user.set({sessionToken: "session-123"}),

        Project.add(@todosPath)
        .then =>
          Project.id(@todosPath)
        .then (id) =>
          @projectId = id
      ])
      .then =>
        @sandbox.stub(api, "updateProjectToken")
          .withArgs(@projectId, "session-123")
          .rejects(new Error)

        cypress.start(["--new-key", "--project=#{@todosPath}"])
      .then =>
        @expectExitWithErr("CANNOT_CREATE_PROJECT_TOKEN")

  context "--run-project", ->
    beforeEach ->
      @sandbox.stub(electron.app, "on").withArgs("ready").yieldsAsync()
      @sandbox.stub(headless, "waitForSocketConnection")
      @sandbox.stub(headless, "createRenderer")
      @sandbox.stub(headless, "waitForTestsToFinishRunning").resolves({failures: 0})
      @sandbox.spy(api, "updateProject")

    it "runs project headlessly and exits with exit code 0", ->
      Project.add(@todosPath)
      .then =>
        cypress.start(["--run-project=#{@todosPath}"])
      .delay(200)
      .then =>
        expect(api.updateProject).not.to.be.called
        expect(headless.createRenderer).to.be.calledWith("http://localhost:8888/__/#/tests/__all")
        @expectExitWith(0)

    it "runs project headlessly and exits with exit code 10", ->
      headless.waitForTestsToFinishRunning.resolves({failures: 10})

      Project.add(@todosPath)
      .then =>
        cypress.start(["--run-project=#{@todosPath}"])
      .delay(200)
      .then =>
        expect(api.updateProject).not.to.be.called
        expect(headless.createRenderer).to.be.calledWith("http://localhost:8888/__/#/tests/__all")
        @expectExitWith(10)

    it "generates a project id if missing one", ->
      @sandbox.stub(api, "createProject").withArgs("pristine", "session-123").resolves("pristine-id-123")

      Promise.all([
        user.set({sessionToken: "session-123"}),

        Project.add(@pristinePath)
      ])
      .then =>
        cypress.start(["--run-project=#{@pristinePath}"])
      .then =>
        @expectExitWith(0)

        ## give it time to request the project id
        Promise.delay(200)
      .then =>
        Project(@pristinePath).getProjectId()
      .then (id) ->
        expect(id).to.eq("pristine-id-123")

    it "does not generate project id when not logged in", ->
      @sandbox.stub(api, "createProject").withArgs("pristine", "session-123").rejects(new Error)

      Project.add(@pristinePath)
      .then =>
        cypress.start(["--run-project=#{@pristinePath}"])
      .then =>
        Promise.delay(200)
      .then =>
        Project(@pristinePath).getProjectId()
        .then ->
          throw new Error("should have caught error but didnt")
        .catch (err) ->
          expect(err.type).to.eq("NO_PROJECT_ID")
      .then =>
        @expectExitWith(0)

    it "does not error when getting a creating a project id fails", ->
      @sandbox.stub(api, "createProject").withArgs("pristine", "session-123").rejects(new Error)

      Project.add(@pristinePath)
      .then =>
        cypress.start(["--run-project=#{@pristinePath}"])
      .delay(200)
      .then =>
        @expectExitWith(0)

    it "runs project by specific spec and exits with status 0", ->
      Project.add(@todosPath)
      .then =>
        cypress.start(["--run-project=#{@todosPath}", "--spec=tests/test2.coffee"])
      .then =>
        expect(headless.createRenderer).to.be.calledWith("http://localhost:8888/__/#/tests/integration/test2.coffee")
        @expectExitWith(0)

    it "runs project by specific spec with default configuration", ->
      Project.add(@idsPath)
      .then =>
        cypress.start(["--run-project=#{@idsPath}", "--spec=cypress/integration/bar.js", "--config", "port=2020"])
      .then =>
        expect(headless.createRenderer).to.be.calledWith("http://localhost:2020/__/#/tests/integration/bar.js")
        @expectExitWith(0)

    it "runs project by specific absolute spec and exits with status 0", ->
      Project.add(@todosPath)
      .then =>
        cypress.start(["--run-project=#{@todosPath}", "--spec=#{@todosPath}/tests/test2.coffee"])
      .then =>
        expect(headless.createRenderer).to.be.calledWith("http://localhost:8888/__/#/tests/integration/test2.coffee")
        @expectExitWith(0)

    it "scaffolds out integration and example_spec if they do not exist when not headless", ->
      Promise.all([
        config.get(@pristinePath).then (@cfg) =>

        Project.add(@pristinePath)
      ])
      .then =>
        fs.statAsync(@cfg.integrationFolder)
        .then ->
          throw new Error("integrationFolder should not exist!")
        .catch =>
          cypress.start(["--run-project=#{@pristinePath}", "--no-headless"])
        .then =>
          fs.statAsync(@cfg.integrationFolder)
        .then =>
          fs.statAsync path.join(@cfg.integrationFolder, "example_spec.js")

    it "does not scaffolds out when headless", ->
      Promise.all([
        config.get(@pristinePath).then (@cfg) =>

        Project.add(@pristinePath)
      ])
      .then =>
        fs.statAsync(@cfg.integrationFolder)
        .then ->
          throw new Error("integrationFolder should not exist!")
        .catch {code: "ENOENT"}, =>
          cypress.start(["--run-project=#{@pristinePath}"])
        .then =>
          fs.statAsync(@cfg.integrationFolder)
        .then ->
          throw new Error("integrationFolder should not exist!")
        .catch {code: "ENOENT"}, =>

    it "scaffolds out fixtures + files if they do not exist", ->
      Promise.all([
        config.get(@pristinePath).then (@cfg) =>

        Project.add(@pristinePath)
      ])
      .then =>
        fs.statAsync(@cfg.fixturesFolder)
        .then ->
          throw new Error("fixturesFolder should not exist!")
        .catch =>
          cypress.start(["--run-project=#{@pristinePath}", "--no-headless"])
        .then =>
          fs.statAsync(@cfg.fixturesFolder)
        .then =>
          fs.statAsync path.join(@cfg.fixturesFolder, "example.json")

    it "scaffolds out support + files if they do not exist", ->
      supportFolder = path.join(@pristinePath, "cypress/support")

      Promise.all([
        config.get(@pristinePath).then (@cfg) =>

        Project.add(@pristinePath)
      ])
      .then =>
        fs.statAsync(supportFolder)
        .then ->
          throw new Error("supportFolder should not exist!")
        .catch {code: "ENOENT"}, =>
          cypress.start(["--run-project=#{@pristinePath}", "--no-headless"])
        .then =>
          fs.statAsync(supportFolder)
        .then =>
          fs.statAsync path.join(supportFolder, "index.js")
        .then =>
          fs.statAsync path.join(supportFolder, "commands.js")
        .then =>
          fs.statAsync path.join(supportFolder, "defaults.js")

    it "removes fixtures when they exist and fixturesFolder is false", (done) ->
      Promise.all([
        config.get(@idsPath).then (@cfg) =>

        Project.add(@idsPath)
      ])
      .then =>
        fs.statAsync(@cfg.fixturesFolder)
      .then =>
        settings.read(@idsPath)
      .then (json) =>
        json.fixturesFolder = false
        settings.write(@idsPath, json)
      .then =>
        cypress.start(["--run-project=#{@idsPath}"])
      .then =>
        fs.statAsync(@cfg.fixturesFolder)
        .then ->
          throw new Error("fixturesFolder should not exist!")
        .catch -> done()

    it "does not watch supportFile when headless", ->
      shouldWatch = @sandbox.spy(bundle, "shouldWatch")

      cypress.start(["--run-project=#{@pristinePath}"])
      .then =>
        expect(shouldWatch).to.have.always.returned(false)

    it "does watch supportFile when not headless", ->
      shouldWatch = @sandbox.spy(bundle, "shouldWatch")
      watchBundle = @sandbox.spy(Watchers.prototype, "watchBundle")

      cypress.start(["--run-project=#{@pristinePath}", "--no-headless"])
      .then =>
        expect(watchBundle).to.be.calledWith("cypress/support/index.js")
        expect(shouldWatch).to.have.always.returned(true)

    it "runs project headlessly and displays gui", ->
      Project.add(@todosPath)
      .then =>
        cypress.start(["--run-project=#{@todosPath}", "--show-headless-gui"])
      .then =>
        expect(headless.createRenderer).to.be.calledWith("http://localhost:8888/__/#/tests/__all", "http://localhost:8888", true)
        @expectExitWith(0)

    it "turns on reporting", ->
      @sandbox.spy(Reporter, "create")

      Project.add(@todosPath)
      .then =>
        cypress.start(["--run-project=#{@todosPath}"])
      .then  =>
        expect(Reporter.create).to.be.calledWith("spec")
        @expectExitWith(0)

    it "can change the reporter to nyan", ->
      @sandbox.spy(Reporter, "create")

      Project.add(@todosPath)
      .then =>
        cypress.start(["--run-project=#{@todosPath}", "--reporter=nyan"])
      .then  =>
        expect(Reporter.create).to.be.calledWith("nyan")
        @expectExitWith(0)

    it "can change the reporter with cypress.json", ->
      @sandbox.spy(Reporter, "create")

      Promise.all([
        config.get(@idsPath).then (@cfg) =>

        Project.add(@idsPath)
      ])
      .then =>
        settings.read(@idsPath)
      .then (json) =>
        json.reporter = "dot"
        settings.write(@idsPath, json)
      .then =>
        cypress.start(["--run-project=#{@idsPath}"])
      .then =>
        expect(Reporter.create).to.be.calledWith("dot")
        @expectExitWith(0)

    it "runs tests even when user isn't logged in", ->
      Promise.all([
        user.set({}),

        Project.add(@todosPath)
      ])
      .then =>
        cypress.start(["--run-project=#{@todosPath}"])
      .then =>
        @expectExitWith(0)

    it "logs error when supportFile doesn't exist", ->
      Promise.all([
        settings.write(@idsPath, {supportFile: "/does/not/exist"})

        Project.add(@idsPath)
      ])
      .then =>
        cypress.start(["--run-project=#{@idsPath}"])
      .then =>
        @expectExitWithErr("SUPPORT_FILE_NOT_FOUND", "Your supportFile is set to '/does/not/exist',")

    it "logs error and exits when spec file was specified and does not exist", ->
      Project.add(@todosPath)
      .then =>
        cypress.start(["--run-project=#{@todosPath}", "--spec=path/to/spec"])
      .then =>
        @expectExitWithErr("SPEC_FILE_NOT_FOUND", "#{@todosPath}/path/to/spec")

    it "logs error and exits when spec absolute file was specified and does not exist", ->
      Project.add(@todosPath)
      .then =>
        cypress.start(["--run-project=#{@todosPath}", "--spec=#{@todosPath}/tests/path/to/spec"])
      .then =>
        @expectExitWithErr("SPEC_FILE_NOT_FOUND", "#{@todosPath}/tests/path/to/spec")

    it "logs error and exits when project has cypress.json syntax error", ->
      Promise.all([
        user.set({name: "brian", sessionToken: "session-123"}),

        Project.add(@todosPath)
      ])
      .then =>
        fs.writeFileAsync(@todosPath + "/cypress.json", "{'foo': 'bar}")
      .then =>
        cypress.start(["--run-project=#{@todosPath}"])
      .then =>
        @expectExitWithErr("ERROR_READING_FILE", @todosPath)

    it "logs error and exits when project has cypress.env.json syntax error", ->
      Promise.all([
        user.set({name: "brian", sessionToken: "session-123"}),

        Project.add(@todosPath)
      ])
      .then =>
        fs.writeFileAsync(@todosPath + "/cypress.env.json", "{'foo': 'bar}")
      .then =>
        cypress.start(["--run-project=#{@todosPath}"])
      .then =>
        @expectExitWithErr("ERROR_READING_FILE", @todosPath)

    ## TODO: make sure we have integration tests around this
    ## for headed projects!
    ## also make sure we test the rest of the integration functionality
    ## for headed errors! <-- not unit tests, but integration tests!
    it "logs error and exits when project folder has read permissions only and cannot write cypress.json", ->
      permissionsPath = path.resolve("./permissions")

      @sandbox.stub(inquirer, "prompt").yieldsAsync({add: true})

      user.set({sessionToken: "session-123"})
      .then =>
        fs.ensureDirAsync(permissionsPath)
      .then =>
        fs.chmodAsync(permissionsPath, "111")
      .then =>
        cypress.start(["--run-project=#{permissionsPath}"])
      .then =>
        fs.chmodAsync(permissionsPath, "644")
        .then =>
          fs.removeAsync(permissionsPath)
          .then =>
            @expectExitWithErr("ERROR_WRITING_FILE", permissionsPath)

    describe "morgan", ->
      it "sets morgan to false", ->
        Project.add(@todosPath)
        .then =>
          cypress.start(["--run-project=#{@todosPath}"])
        .then =>
          expect(project.opened().cfg.morgan).to.be.false
          @expectExitWith(0)

    describe "config overrides", ->
      it "can override default values", ->
        Project.add(@todosPath)
        .then =>
          cypress.start(["--run-project=#{@todosPath}", "--config=requestTimeout=1234,baseUrl=localhost"])
        .then =>
          cfg = project.opened().cfg

          expect(cfg.baseUrl).to.eq("localhost")
          expect(cfg.requestTimeout).to.eq(1234)

          expect(cfg.resolved.baseUrl).to.deep.eq({
            value: "localhost"
            from: "cli"
          })
          expect(cfg.resolved.requestTimeout).to.deep.eq({
            value: 1234
            from: "cli"
          })

          @expectExitWith(0)

    describe "--port", ->
      beforeEach ->
        headless.waitForTestsToFinishRunning.resolves({failures: 0})

        Project.add(@todosPath)

      it "can change the default port to 5555", ->
        listen = @sandbox.spy(http.Server.prototype, "listen")
        open   = @sandbox.spy(Server.prototype, "open")

        cypress.start(["--run-project=#{@todosPath}", "--port=5555"])
        .then =>
          expect(project.opened().cfg.port).to.eq(5555)
          expect(listen).to.be.calledWith(5555)
          expect(open).to.be.calledWithMatch({port: 5555})
          @expectExitWith(0)

      ## TODO: handle PORT_IN_USE short integration test
      it "logs error and exits when port is in use", ->
        server = http.createServer()
        server = Promise.promisifyAll(server)

        server.listenAsync(5555)
        .then =>
          cypress.start(["--run-project=#{@todosPath}", "--port=5555"])
        .then =>
          @expectExitWithErr("PORT_IN_USE_LONG", "5555")

    describe "--env", ->
      beforeEach ->
        @env = process.env

        process.env = _.omit(process.env, "CYPRESS_DEBUG")

        headless.waitForTestsToFinishRunning.resolves({failures: 0})

        Project.add(@todosPath)

      afterEach ->
        process.env = @env

      it "can set specific environment variables", ->
        cypress.start([
          "--run-project=#{@todosPath}",
          "--videoRecording=false"
          "--env",
          "version=0.12.1,foo=bar,host=http://localhost:8888"
        ])
        .then =>
          expect(project.opened().cfg.environmentVariables).to.deep.eq({
            version: "0.12.1"
            foo: "bar"
            host: "http://localhost:8888"
          })

          @expectExitWith(0)

  ## the majority of the logic in CI is covered already
  ## in --run-project specs above
  context "--ci", ->
    afterEach ->
      delete process.env.CYPRESS_PROJECT_ID

    beforeEach ->
      @setup = =>
        @createBuild = @sandbox.stub(api, "createBuild").withArgs({
          projectId:     @projectId
          projectToken: "token-123"
          commitSha:    "sha-123"
          commitBranch: "bem/ci"
          commitAuthorName: "brian"
          commitAuthorEmail:  "brian@cypress.io"
          commitMessage: "foo"
        })

      @upload = @sandbox.stub(ci, "upload").resolves()

      @sandbox.stub(os, "platform").returns("linux")
      ## TODO: might need to change this to a different return
      @sandbox.stub(electron.app, "on").withArgs("ready").yieldsAsync()
      @sandbox.stub(ci, "getSha").resolves("sha-123")
      @sandbox.stub(ci, "getBranch").resolves("bem/ci")
      @sandbox.stub(ci, "getAuthor").resolves("brian")
      @sandbox.stub(ci, "getEmail").resolves("brian@cypress.io")
      @sandbox.stub(ci, "getMessage").resolves("foo")
      @sandbox.stub(headless, "createRenderer")
      @sandbox.stub(headless, "waitForSocketConnection")
      @sandbox.stub(headless, "waitForTestsToFinishRunning").resolves({
        tests: 1
        passes: 2
        failures: 3
        pending: 4
        duration: 5
        video: true
        screenshots: []
        failingTests: []
        config: {}
      })

      Promise.all([
        ## make sure we have no user object
        user.set({})

        Project.id(@todosPath)
        .then (id) =>
          @projectId = id
      ])

    ## TODO: add tests around uploadingAssets + upload

    it "runs project in ci and exits with number of failures", ->
      @setup()

      @createBuild.resolves("build-id-123")

      @createInstance = @sandbox.stub(api, "createInstance").withArgs({
        buildId: "build-id-123"
        spec: undefined
      }).resolves("instance-id-123")

      @updateInstance = @sandbox.stub(api, "updateInstance").withArgs({
        instanceId: "instance-id-123"
        tests: 1
        passes: 2
        failures: 3
        pending: 4
        duration: 5
        video: true
        error: undefined
        screenshots: []
        failingTests: []
        cypressConfig: {}
      }).resolves()

      cypress.start(["--run-project=#{@todosPath}",  "--key=token-123", "--ci"])
      .then =>
        expect(@createInstance).to.be.calledOnce
        expect(@updateInstance).to.be.calledOnce
        @expectExitWith(3)

    it "runs project by specific absolute spec and exits with status 3", ->
      @setup()

      @createBuild.resolves("build-id-123")

      @sandbox.stub(api, "createInstance").withArgs({
        buildId: "build-id-123"
        spec: "#{@todosPath}/tests/test2.coffee"
      }).resolves("instance-id-123")

      @updateInstance = @sandbox.stub(api, "updateInstance").resolves()

      cypress.start(["--run-project=#{@todosPath}", "--key=token-123", "--ci", "--spec=#{@todosPath}/tests/test2.coffee"])
      .then =>
        expect(headless.createRenderer).to.be.calledWith("http://localhost:8888/__/#/tests/integration/test2.coffee")
        @expectExitWith(3)

    it "uses process.env.CYPRESS_PROJECT_ID", ->
      @setup()

      ## set the projectId to be todos even though
      ## we are running the prisine project
      process.env.CYPRESS_PROJECT_ID = @projectId

      @createBuild.resolves()
      @sandbox.stub(api, "createInstance").resolves()

      cypress.start(["--run-project=#{@pristinePath}", "--key=token-123", "--ci"])
      .then =>
        @expectExitWith(3)

    it "logs error when missing project id", ->
      @setup()

      cypress.start(["--run-project=#{@pristinePath}", "--key=token-123", "--ci"])
      .then =>
        @expectExitWithErr("NO_PROJECT_ID", @pristinePath)

    it "logs error and exits when ci key is not valid", ->
      @setup()

      err = new Error
      err.statusCode = 401
      @createBuild.rejects(err)

      cypress.start(["--run-project=#{@todosPath}", "--key=token-123", "--ci"])
      .then =>
        @expectExitWithErr("CI_KEY_NOT_VALID", "token...n-123")

    it "logs error and exits when project could not be found", ->
      @setup()

      err = new Error
      err.statusCode = 404
      @createBuild.rejects(err)

      cypress.start(["--run-project=#{@todosPath}", "--key=token-123", "--ci"])
      .then =>
        @expectExitWithErr("CI_PROJECT_NOT_FOUND")

    it "logs error but continues running the tests", ->
      @setup()

      err = new Error
      err.statusCode = 500
      @createBuild.rejects(err)

      cypress.start(["--run-project=#{@todosPath}", "--key=token-123", "--ci"])
      .then =>
        @expectExitWith(3)

    it "logs error and exits when ci key is missing", ->
      @setup()

      err = new Error
      err.statusCode = 401
      @createBuild.rejects(err)

      cypress.start(["--run-project=#{@todosPath}", "--ci"])
      .then =>
        @expectExitWithErr("CI_KEY_MISSING")

  context "--return-pkg", ->
    beforeEach ->
      @sandbox.stub(console, "log")

    it "logs package.json and exits", ->
      cypress.start(["--return-pkg"])
      .then =>
        expect(console.log).to.be.calledWithMatch('{"name":"cypress"')
        @expectExitWith(0)

  context "--version", ->
    beforeEach ->
      @sandbox.stub(console, "log")

    it "logs version and exits", ->
      cypress.start(["--version"])
      .then =>
        expect(console.log).to.be.calledWith(pkg.version)
        @expectExitWith(0)

  context "--smoke-test", ->
    beforeEach ->
      @sandbox.stub(console, "log")

    it "logs pong value and exits", ->
      cypress.start(["--smoke-test", "--ping=abc123"])
      .then =>
        expect(console.log).to.be.calledWith("abc123")
        @expectExitWith(0)

  context "--remove-ids", ->
    it "logs stats", ->
      idsPath = Fixtures.projectPath("ids")
      @sandbox.spy(console, "log")

      cypress.start(["--remove-ids", "--project=#{idsPath}"])
      .then =>
        expect(console.log).to.be.calledWith("Removed '5' ids from '2' files.")
        @expectExitWith(0)

    it "catches errors when project is not found", ->
      cypress.start(["--remove-ids", "--project=path/to/no/project"])
      .then =>
        @expectExitWithErr("NO_PROJECT_FOUND_AT_PROJECT_ROOT", "path/to/no/project")

  context "headed", ->
    beforeEach ->
      @win = {}
      @sandbox.stub(electron.app, "on").withArgs("ready").yieldsAsync()
      @sandbox.stub(Renderer, "create").resolves(@win)
      @sandbox.stub(Server.prototype, "startWebsockets")
      @sandbox.spy(Events, "start")
      @sandbox.stub(electron.ipcMain, "on")

    afterEach ->
      delete process.env.CYPRESS_FILE_SERVER_FOLDER
      delete process.env.CYPRESS_BASE_URL
      delete process.env.CYPRESS_port
      delete process.env.CYPRESS_responseTimeout
      delete process.env.CYPRESS_watch_for_file_changes

    it "passes options to headed.ready", ->
      @sandbox.stub(headed, "ready")

      cypress.start(["--updating", "--port=2121", "--config=pageLoadTimeout=1000"])
      .then ->
        expect(headed.ready).to.be.calledWithMatch({
          updating: true
          port: 2121
          pageLoadTimeout: 1000
        })

    it "passes options to Events.start", ->
      cypress.start(["--port=2121", "--config=pageLoadTimeout=1000"])
      .then ->
        expect(Events.start).to.be.calledWithMatch({
          port: 2121,
          pageLoadTimeout: 1000
        })

    it "calls api.updateProject with projectName and session on open", ->
      @sandbox.stub(Server.prototype, "open").resolves()
      @sandbox.stub(api, "updateProject").resolves()

      Promise.all([
        user.set({name: "brian", sessionToken: "session-123"}),

        Project.add(@todosPath)

        Project.id(@todosPath)
        .then (id) =>
          @projectId = id
      ])
      .then =>
        cypress.start([])
      .then =>
        options = Events.start.firstCall.args[0]
        Events.handleEvent(options, {}, {}, 123, "open:project", @todosPath)
      .delay(200)
      .then =>
        ## must delay here because sync isnt promise connected
        expect(api.updateProject).to.be.calledWith(@projectId, "opened", "todos", "session-123")

    it "calls api.updateProject with projectName and session on close", ->
      @sandbox.stub(Server.prototype, "open").resolves()
      @sandbox.stub(api, "updateProject").resolves()

      Promise.all([
        user.set({name: "brian", sessionToken: "session-123"}),

        Project.add(@todosPath)

        Project.id(@todosPath)
        .then (id) =>
          @projectId = id
      ])
      .then =>
        cypress.start([])
      .then =>
        options = Events.start.firstCall.args[0]
        Events.handleEvent(options, {}, {}, 123, "open:project", @todosPath)
        .delay(200)
        .then =>
          Events.handleEvent(options, {}, {}, 123, "close:project")
      .delay(200)
      .then =>
        ## must delay here because sync isnt promise connected
        expect(api.updateProject).to.be.calledWith(@projectId, "closed", "todos", "session-123")

    it "passes filtered options to Project#open and sets cli config", ->
      sync      = @sandbox.stub(Project.prototype, "sync").resolves()
      getConfig = @sandbox.spy(Project.prototype, "getConfig")
      open      = @sandbox.stub(Server.prototype, "open").resolves()

      process.env.CYPRESS_FILE_SERVER_FOLDER = "foo"
      process.env.CYPRESS_BASE_URL = "localhost"
      process.env.CYPRESS_port = "2222"
      process.env.CYPRESS_responseTimeout = "5555"
      process.env.CYPRESS_watch_for_file_changes = "false"

      Promise.all([
        user.set({name: "brian", sessionToken: "session-123"}),

        Project.add(@todosPath)
      ])
      .then =>
        settings.read(@todosPath)
      .then (json) =>
        ## this should be overriden by the env argument
        json.baseUrl = "http://localhost:8080"
        settings.write(@todosPath, json)
      .then =>
        cypress.start(["--port=2121", "--config", "pageLoadTimeout=1000", "--foo=bar", "--env=baz=baz"])
      .then =>
        options = Events.start.firstCall.args[0]
        Events.handleEvent(options, {}, {}, 123, "open:project", @todosPath)
      .then =>
        expect(getConfig).to.be.calledWithMatch({
          port: 2121
          pageLoadTimeout: 1000
          sync: true
          type: "opened"
          report: false
          environmentVariables: { baz: "baz" }
        })

        cfg = open.getCall(0).args[0]

        expect(cfg.fileServerFolder).to.eq(path.join(@todosPath, "foo"))
        expect(cfg.pageLoadTimeout).to.eq(1000)
        expect(cfg.port).to.eq(2121)
        expect(cfg.baseUrl).to.eq("localhost")
        expect(cfg.watchForFileChanges).to.be.false
        expect(cfg.responseTimeout).to.eq(5555)
        expect(cfg.environmentVariables.baz).to.eq("baz")
        expect(cfg.environmentVariables).not.to.have.property("fileServerFolder")
        expect(cfg.environmentVariables).not.to.have.property("port")
        expect(cfg.environmentVariables).not.to.have.property("BASE_URL")
        expect(cfg.environmentVariables).not.to.have.property("watchForFileChanges")
        expect(cfg.environmentVariables).not.to.have.property("responseTimeout")

        expect(cfg.resolved.fileServerFolder).to.deep.eq({
          value: "foo"
          from: "env"
        })
        expect(cfg.resolved.pageLoadTimeout).to.deep.eq({
          value: 1000
          from: "cli"
        })
        expect(cfg.resolved.port).to.deep.eq({
          value: 2121
          from: "cli"
        })
        expect(cfg.resolved.baseUrl).to.deep.eq({
          value: "localhost"
          from: "env"
        })
        expect(cfg.resolved.watchForFileChanges).to.deep.eq({
          value: false
          from: "env"
        })
        expect(cfg.resolved.responseTimeout).to.deep.eq({
          value: 5555
          from: "env"
        })
        expect(cfg.resolved.environmentVariables.baz).to.deep.eq({
          value: "baz"
          from: "cli"
        })

  context "no args", ->
    beforeEach ->
      @sandbox.stub(electron.app, "on").withArgs("ready").yieldsAsync()
      @sandbox.stub(headed, "ready").resolves()

    it "runs headed and does not exit", ->
      cypress.start().then ->
        expect(headed.ready).to.be.calledOnce
