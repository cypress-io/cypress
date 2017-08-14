require("../spec_helper")

_          = require("lodash")
os         = require("os")
cp         = require("child_process")
path       = require("path")
{ EventEmitter } = require("events")
{ unlinkSync: rm, existsSync: exists } = require("fs")
http       = require("http")
Promise    = require("bluebird")
electron   = require("electron")
Fixtures   = require("../support/helpers/fixtures")
extension  = require("@packages/extension")
pkg        = require("@packages/root")
git        = require("#{root}lib/util/git")
bundle     = require("#{root}lib/util/bundle")
connect    = require("#{root}lib/util/connect")
ciProvider = require("#{root}lib/util/ci_provider")
settings   = require("#{root}lib/util/settings")
Events     = require("#{root}lib/gui/events")
Windows    = require("#{root}lib/gui/windows")
record     = require("#{root}lib/modes/record")
headed     = require("#{root}lib/modes/headed")
headless   = require("#{root}lib/modes/headless")
api        = require("#{root}lib/api")
cwd        = require("#{root}lib/cwd")
user       = require("#{root}lib/user")
config     = require("#{root}lib/config")
cache      = require("#{root}lib/cache")
stdout     = require("#{root}lib/stdout")
errors     = require("#{root}lib/errors")
cypress    = require("#{root}lib/cypress")
Project    = require("#{root}lib/project")
Server     = require("#{root}lib/server")
Reporter   = require("#{root}lib/reporter")
browsers   = require("#{root}lib/browsers")
Watchers   = require("#{root}lib/watchers")
openProject   = require("#{root}lib/open_project")
appData       = require("#{root}lib/util/app_data")
formStatePath = require("#{root}lib/util/saved_state").formStatePath

describe "lib/cypress", ->
  beforeEach ->
    @timeout(5000)

    cache.__removeSync()

    Fixtures.scaffold()
    @todosPath    = Fixtures.projectPath("todos")
    @pristinePath = Fixtures.projectPath("pristine")
    @idsPath      = Fixtures.projectPath("ids")

    ## force cypress to call directly into main without
    ## spawning a separate process
    @sandbox.stub(cypress, "isCurrentlyRunningElectron").returns(true)
    @sandbox.stub(extension, "setHostAndPath").resolves()
    @sandbox.stub(browsers, "get").resolves([])
    @sandbox.stub(process, "exit")
    @sandbox.spy(errors, "log")
    @sandbox.spy(errors, "warning")
    @sandbox.spy(console, "log")

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
    openProject.close()

  context "--get-key", ->
    it "writes out key and exits on success", ->
      Promise.all([
        user.set({name: "brian", authToken: "auth-token-123"}),

        Project.add(@todosPath)
        .then =>
          Project.id(@todosPath)
        .then (id) =>
          @projectId = id
      ])
      .then =>
        @sandbox.stub(api, "getProjectToken")
          .withArgs(@projectId, "auth-token-123")
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
      user.set({authToken: "auth-token-123"})
      .then =>
        cypress.start(["--get-key", "--project=#{@pristinePath}"])
      .then =>
        @expectExitWithErr("NO_PROJECT_ID", @pristinePath)

    it "logs error and exits when project could not be found at the path", ->
      user.set({authToken: "auth-token-123"})
      .then =>
        cypress.start(["--get-key", "--project=path/to/no/project"])
      .then =>
        @expectExitWithErr("NO_PROJECT_FOUND_AT_PROJECT_ROOT", "path/to/no/project")

    it "logs error and exits when project token cannot be fetched", ->
      Promise.all([
        user.set({authToken: "auth-token-123"}),

        Project.add(@todosPath)
        .then =>
          Project.id(@todosPath)
        .then (id) =>
          @projectId = id
      ])
      .then =>
        @sandbox.stub(api, "getProjectToken")
          .withArgs(@projectId, "auth-token-123")
          .rejects(new Error())

        cypress.start(["--get-key", "--project=#{@todosPath}"])
      .then =>
        @expectExitWithErr("CANNOT_FETCH_PROJECT_TOKEN")

  context "--new-key", ->
    it "writes out key and exits on success", ->
      Promise.all([
        user.set({name: "brian", authToken: "auth-token-123"}),

        Project.add(@todosPath)
        .then =>
          Project.id(@todosPath)
        .then (id) =>
          @projectId = id
      ])
      .then =>
        @sandbox.stub(api, "updateProjectToken")
          .withArgs(@projectId, "auth-token-123")
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
      user.set({authToken: "auth-token-123"})
      .then =>
        cypress.start(["--new-key", "--project=#{@pristinePath}"])
      .then =>
        @expectExitWithErr("NO_PROJECT_ID", @pristinePath)

    it "logs error and exits when project could not be found at the path", ->
      user.set({authToken: "auth-token-123"})
      .then =>
        cypress.start(["--new-key", "--project=path/to/no/project"])
      .then =>
        @expectExitWithErr("NO_PROJECT_FOUND_AT_PROJECT_ROOT", "path/to/no/project")

    it "logs error and exits when project token cannot be fetched", ->
      Promise.all([
        user.set({authToken: "auth-token-123"}),

        Project.add(@todosPath)
        .then =>
          Project.id(@todosPath)
        .then (id) =>
          @projectId = id
      ])
      .then =>
        @sandbox.stub(api, "updateProjectToken")
          .withArgs(@projectId, "auth-token-123")
          .rejects(new Error())

        cypress.start(["--new-key", "--project=#{@todosPath}"])
      .then =>
        @expectExitWithErr("CANNOT_CREATE_PROJECT_TOKEN")

  context "--run-project", ->
    beforeEach ->
      @sandbox.stub(electron.app, "on").withArgs("ready").yieldsAsync()
      @sandbox.stub(headless, "waitForSocketConnection")
      @sandbox.stub(headless, "listenForProjectEnd").resolves({failures: 0})
      @sandbox.stub(browsers, "open")
      @sandbox.stub(git, "_getRemoteOrigin").resolves("remoteOrigin")

    context "state", ->
      statePath = null
      beforeEach ->
        # TODO switch to async file system calls
        statePath = appData.path(formStatePath(@todosPath))
        rm(statePath) if exists(statePath)
      afterEach ->
        rm(statePath)

      it "saves project state", ->
        Project.add(@todosPath)
        .then =>
          cypress.start(["--run-project=#{@todosPath}", "--spec=tests/test2.coffee"])
        .then =>
          @expectExitWith(0)
        .then ->
          openProject.getProject().saveState()
        .then (state) ->
          expect(exists(statePath), "Finds saved stage file #{statePath}").to.be.true

    it "runs project headlessly and exits with exit code 0 and yells about old version of CLI", ->
      Project.add(@todosPath)
      .then =>
        cypress.start(["--run-project=#{@todosPath}"])
      .then =>
        expect(browsers.open).to.be.calledWithMatch("electron", {url: "http://localhost:8888/__/#/tests/__all"})
        expect(errors.warning).to.be.calledWith("OLD_VERSION_OF_CLI")
        expect(console.log).to.be.calledWithMatch("You are using an older version of the CLI tools.")
        @expectExitWith(0)

    it "warns when using old version of the CLI tools", ->
      Project.add(@todosPath)
      .then =>
        ## test that --run-project gets properly aliased to project
        cypress.start(["--run-project=#{@todosPath}"])
      .then =>
        expect(errors.warning).to.be.calledWith("OLD_VERSION_OF_CLI")
        expect(console.log).to.be.calledWithMatch("You are using an older version of the CLI tools.")
        @expectExitWith(0)

    it "does not warn about old version of the CLI tools if --cli-version has been set", ->
      Project.add(@todosPath)
      .then =>
        ## test that --run-project gets properly aliased to project
        cypress.start(["--run-project=#{@todosPath}", "--cli-version=0.19.0"])
      .then =>
        expect(errors.warning).not.to.be.calledWith("OLD_VERSION_OF_CLI")
        @expectExitWith(0)

    it "runs project headlessly and exits with exit code 10", ->
      headless.listenForProjectEnd.resolves({failures: 10})

      Project.add(@todosPath)
      .then =>
        cypress.start(["--run-project=#{@todosPath}"])
      .then =>
        expect(browsers.open).to.be.calledWithMatch("electron", {url: "http://localhost:8888/__/#/tests/__all"})
        @expectExitWith(10)

    it "does not generate a project id even if missing one", ->
      @sandbox.stub(api, "createProject")

      Promise.all([
        user.set({authToken: "auth-token-123"}),

        Project.add(@pristinePath)
      ])
      .then =>
        cypress.start(["--run-project=#{@pristinePath}"])
      .then =>
        @expectExitWith(0)
      .then =>
        expect(api.createProject).not.to.be.called

        Project(@pristinePath).getProjectId()
        .then ->
          throw new Error("should have caught error but didnt")
        .catch (err) ->
          expect(err.type).to.eq("NO_PROJECT_ID")

    it "runs project by specific spec and exits with status 0", ->
      Project.add(@todosPath)
      .then =>
        cypress.start(["--run-project=#{@todosPath}", "--spec=tests/test2.coffee"])
      .then =>
        expect(browsers.open).to.be.calledWithMatch("electron", {url: "http://localhost:8888/__/#/tests/integration/test2.coffee"})
        @expectExitWith(0)

    it "runs project by specific spec with default configuration", ->
      Project.add(@idsPath)
      .then =>
        cypress.start(["--run-project=#{@idsPath}", "--spec=cypress/integration/bar.js", "--config", "port=2020"])
      .then =>
        expect(browsers.open).to.be.calledWithMatch("electron", {url: "http://localhost:2020/__/#/tests/integration/bar.js"})
        @expectExitWith(0)

    it "runs project by specific absolute spec and exits with status 0", ->
      Project.add(@todosPath)
      .then =>
        cypress.start(["--run-project=#{@todosPath}", "--spec=#{@todosPath}/tests/test2.coffee"])
      .then =>
        expect(browsers.open).to.be.calledWithMatch("electron", {url: "http://localhost:8888/__/#/tests/integration/test2.coffee"})
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
      bundle._watching = false
      cypress.start(["--run-project=#{@pristinePath}"])
      .then =>
        expect(bundle._watching).to.be.false

    it "does watch supportFile when not headless", ->
      bundle._watching = false
      watchBundle = @sandbox.spy(Watchers.prototype, "watchBundle")

      cypress.start(["--run-project=#{@pristinePath}", "--no-headless"])
      .then =>
        expect(watchBundle).to.be.calledWith("cypress/support/index.js")
        expect(bundle._watching).to.be.true

    it "runs project headlessly and displays gui", ->
      Project.add(@todosPath)
      .then =>
        cypress.start(["--run-project=#{@todosPath}", "--show-headless-gui"])
      .then =>
        expect(browsers.open).to.be.calledWithMatch("electron", {
          url: "http://localhost:8888/__/#/tests/__all"
          proxyServer: "http://localhost:8888"
          show: true
        })
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

    it "logs warning when projectId and key but no record option", ->
      Project.add(@todosPath)
      .then =>
        cypress.start(["--run-project=#{@todosPath}", "--cli-version=0.19.0", "--key=asdf"])
      .then =>
        expect(errors.warning).not.to.be.calledWith("OLD_VERSION_OF_CLI")
        expect(errors.warning).to.be.calledWith("PROJECT_ID_AND_KEY_BUT_MISSING_RECORD_OPTION", "abc123")
        expect(console.log).to.be.calledWithMatch("You also provided your Record Key, but you did not pass the --record flag.")
        expect(console.log).to.be.calledWithMatch("cypress run --record")
        expect(console.log).to.be.calledWithMatch("https://on.cypress.io/recording-project-runs")

    it "does not log warning when no projectId", ->
      Project.add(@pristinePath)
      .then =>
        cypress.start(["--run-project=#{@pristinePath}", "--cli-version=0.19.0", "--key=asdf"])
      .then =>
        expect(errors.warning).not.to.be.calledWith("PROJECT_ID_AND_KEY_BUT_MISSING_RECORD_OPTION", "abc123")
        expect(console.log).not.to.be.calledWithMatch("cypress run --key <record_key>")

    it "does not log warning when projectId but --record false", ->
      Project.add(@todosPath)
      .then =>
        cypress.start(["--run-project=#{@todosPath}", "--cli-version=0.19.0", "--key=asdf", "--record=false"])
      .then =>
        expect(errors.warning).not.to.be.calledWith("PROJECT_ID_AND_KEY_BUT_MISSING_RECORD_OPTION", "abc123")
        expect(console.log).not.to.be.calledWithMatch("cypress run --key <record_key>")

    it "writes json results when passed outputPath", ->
      obj = {
        tests:       1
        passes:      2
        pending:     3
        failures:    4
        duration:    5
        video:       6
        version:     7
        screenshots: []
      }

      outputPath = "./.results/results.json"

      headless.listenForProjectEnd.resolves(_.clone(obj))

      Project.add(@todosPath)
      .then =>
        cypress.start(["--run-project=#{@todosPath}", "--output-path=#{outputPath}"])
      .then =>
        @expectExitWith(4)

        fs.readJsonAsync(cwd(outputPath))
        .then (json) ->
          expect(json).to.deep.eq(
            headless.collectTestResults(obj)
          )
      .finally =>
        fs.removeAsync(cwd(path.dirname(outputPath)))

    it "logs error when supportFile doesn't exist", ->
      Promise.all([
        settings.write(@idsPath, {supportFile: "/does/not/exist"})

        Project.add(@idsPath)
      ])
      .then =>
        cypress.start(["--run-project=#{@idsPath}"])
      .then =>
        @expectExitWithErr("SUPPORT_FILE_NOT_FOUND", "Your supportFile is set to '/does/not/exist',")

    ## FIXME
    it.skip "logs error when browser cannot be found", ->
      cypress.start(["--run-project=#{@idsPath}", "--browser=foo"])
      .then =>
        @expectExitWithErr("BROWSER_NOT_FOUND", "browser foo")

    it "logs error and exits when spec file was specified and does not exist", ->
      Project.add(@todosPath)
      .then =>
        cypress.start(["--run-project=#{@todosPath}", "--cli-version", "--spec=path/to/spec"])
      .then =>
        @expectExitWithErr("SPEC_FILE_NOT_FOUND", "#{@todosPath}/path/to/spec")

    it "logs error and exits when spec absolute file was specified and does not exist", ->
      Project.add(@todosPath)
      .then =>
        cypress.start(["--run-project=#{@todosPath}", "--cli-version", "--spec=#{@todosPath}/tests/path/to/spec"])
      .then =>
        @expectExitWithErr("SPEC_FILE_NOT_FOUND", "#{@todosPath}/tests/path/to/spec")

    it "logs error and exits when project has cypress.json syntax error", ->
      Project.add(@todosPath)
      .then =>
        fs.writeFileAsync(@todosPath + "/cypress.json", "{'foo': 'bar}")
      .then =>
        cypress.start(["--run-project=#{@todosPath}"])
      .then =>
        @expectExitWithErr("ERROR_READING_FILE", @todosPath)

    it "logs error and exits when project has cypress.env.json syntax error", ->
      Project.add(@todosPath)
      .then =>
        fs.writeFileAsync(@todosPath + "/cypress.env.json", "{'foo': 'bar}")
      .then =>
        cypress.start(["--run-project=#{@todosPath}"])
      .then =>
        @expectExitWithErr("ERROR_READING_FILE", @todosPath)

    it "logs error and exits when project has invalid cypress.json values", ->
      Promise.all([
        Project.add(@todosPath)

        settings.write(@todosPath, {baseUrl: "localhost:9999"})
      ])
      .then =>
        cypress.start(["--run-project=#{@todosPath}"])
      .then =>
        @expectExitWithErr("CONFIG_VALIDATION_ERROR", "cypress.json")

    it "logs error and exits when baseUrl cannot be verified", ->
      Promise.all([
        Project.add(@todosPath)

        settings.write(@todosPath, {baseUrl: "http://localhost:90874"})
      ])
      .then =>
        cypress.start(["--run-project=#{@todosPath}"])
      .then =>
        @expectExitWithErr("CANNOT_CONNECT_BASE_URL", "http://localhost:90874")

    ## TODO: make sure we have integration tests around this
    ## for headed projects!
    ## also make sure we test the rest of the integration functionality
    ## for headed errors! <-- not unit tests, but integration tests!
    it "logs error and exits when project folder has read permissions only and cannot write cypress.json", ->
      permissionsPath = path.resolve("./permissions")

      fs.ensureDirAsync(permissionsPath)
      .then =>
        fs.chmodAsync(permissionsPath, "111")
      .then =>
        cypress.start(["--run-project=#{permissionsPath}", "--cli-version"])
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
          expect(openProject.getProject().cfg.morgan).to.be.false
          @expectExitWith(0)

    describe "config overrides", ->
      it "can override default values", ->
        Project.add(@todosPath)
        .then =>
          cypress.start(["--run-project=#{@todosPath}", "--config=requestTimeout=1234,videoCompression=false"])
        .then =>
          cfg = openProject.getProject().cfg

          expect(cfg.videoCompression).to.be.false
          expect(cfg.requestTimeout).to.eq(1234)

          expect(cfg.resolved.videoCompression).to.deep.eq({
            value: false
            from: "cli"
          })
          expect(cfg.resolved.requestTimeout).to.deep.eq({
            value: 1234
            from: "cli"
          })

          @expectExitWith(0)

    describe "--port", ->
      beforeEach ->
        headless.listenForProjectEnd.resolves({failures: 0})

        Project.add(@todosPath)

      it "can change the default port to 5555", ->
        listen = @sandbox.spy(http.Server.prototype, "listen")
        open   = @sandbox.spy(Server.prototype, "open")

        cypress.start(["--run-project=#{@todosPath}", "--port=5555"])
        .then =>
          expect(openProject.getProject().cfg.port).to.eq(5555)
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

        headless.listenForProjectEnd.resolves({failures: 0})

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
          expect(openProject.getProject().cfg.environmentVariables).to.deep.eq({
            version: "0.12.1"
            foo: "bar"
            host: "http://localhost:8888"
          })

          @expectExitWith(0)

  ## the majority of the logic in Record mode is covered already
  ## in --run-project specs above
  context "--record or --ci", ->
    afterEach ->
      delete process.env.CYPRESS_PROJECT_ID

    beforeEach ->
      @setup = =>
        @createRun = @sandbox.stub(api, "createRun").withArgs({
          projectId:    @projectId
          recordKey:    "token-123"
          commitSha:    "sha-123"
          commitBranch: "bem/ci"
          commitAuthorName: "brian"
          commitAuthorEmail:  "brian@cypress.io"
          commitMessage: "foo"
          remoteOrigin: "https://github.com/foo/bar.git"
          ciProvider: "travis"
          ciBuildNumber: "987"
          ciParams: null
        })

      @upload = @sandbox.stub(record, "upload").resolves()
      @sandbox.stub(stdout, "capture").returns({
        toString: -> "foobarbaz"
      })


      @sandbox.stub(ciProvider, "name").returns("travis")
      @sandbox.stub(ciProvider, "buildNum").returns("987")
      @sandbox.stub(ciProvider, "params").returns(null)
      @sandbox.stub(os, "platform").returns("linux")
      ## TODO: might need to change this to a different return
      @sandbox.stub(electron.app, "on").withArgs("ready").yieldsAsync()
      @sandbox.stub(git, "_getSha").resolves("sha-123")
      @sandbox.stub(git, "_getAuthor").resolves("brian")
      @sandbox.stub(git, "_getEmail").resolves("brian@cypress.io")
      @sandbox.stub(git, "_getMessage").resolves("foo")
      @sandbox.stub(git, "_getRemoteOrigin").resolves("https://github.com/foo/bar.git")
      @sandbox.stub(record, "getBranch").resolves("bem/ci")
      @sandbox.stub(browsers, "open")
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

      @createRun.resolves("build-id-123")

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
        ciProvider: "travis"
        stdout: "foobarbaz"
      }).resolves()

      cypress.start(["--run-project=#{@todosPath}", "--record",  "--key=token-123"])
      .then =>
        expect(@createInstance).to.be.calledOnce
        expect(@updateInstance).to.be.calledOnce
        @expectExitWith(3)

    it "runs project by specific absolute spec and exits with status 3", ->
      @setup()

      @createRun.resolves("build-id-123")

      @sandbox.stub(api, "createInstance").withArgs({
        buildId: "build-id-123"
        spec: "#{@todosPath}/tests/test2.coffee"
      }).resolves("instance-id-123")

      @updateInstance = @sandbox.stub(api, "updateInstance").resolves()

      cypress.start(["--run-project=#{@todosPath}", "--record", "--key=token-123", "--spec=#{@todosPath}/tests/test2.coffee"])
      .then =>
        expect(browsers.open).to.be.calledWithMatch("electron", {url: "http://localhost:8888/__/#/tests/integration/test2.coffee"})
        @expectExitWith(3)

    it "uses process.env.CYPRESS_PROJECT_ID", ->
      @setup()

      ## set the projectId to be todos even though
      ## we are running the prisine project
      process.env.CYPRESS_PROJECT_ID = @projectId

      @createRun.resolves()
      @sandbox.stub(api, "createInstance").resolves()

      cypress.start(["--run-project=#{@pristinePath}", "--cli-version=0.19.0", "--record", "--key=token-123"])
      .then =>
        expect(errors.warning).not.to.be.called
        @expectExitWith(3)

    it "still records even with old --ci option", ->
      @setup()

      @createRun.resolves("build-id-123")
      @sandbox.stub(api, "createInstance").resolves()
      @sandbox.stub(api, "updateInstance").resolves()

      cypress.start(["--run-project=#{@todosPath}", "--cli-version=0.19.0", "--key=token-123", "--ci"])
      .then =>
        @expectExitWith(3)

    it "logs warning when using deprecated --ci arg and no env var", ->
      @setup()

      @createRun.resolves("build-id-123")
      @sandbox.stub(api, "createInstance").resolves()
      @sandbox.stub(api, "updateInstance").resolves()

      cypress.start(["--run-project=#{@todosPath}", "--cli-version=0.19.0", "--key=token-123", "--ci"])
      .then =>
        expect(errors.warning).not.to.be.calledWith("OLD_VERSION_OF_CLI")
        expect(errors.warning).to.be.calledWith("CYPRESS_CI_DEPRECATED")
        expect(console.log).to.be.calledWithMatch("You are using the deprecated command:")
        expect(console.log).to.be.calledWithMatch("cypress run --record --key <record_key>")

    it "logs ONLY CLI warning when using older version of CLI when using deprecated --ci", ->
      @setup()

      @createRun.resolves("build-id-123")
      @sandbox.stub(api, "createInstance").resolves()
      @sandbox.stub(api, "updateInstance").resolves()

      cypress.start(["--run-project=#{@todosPath}", "--key=token-123", "--ci"])
      .then =>
        expect(errors.warning).to.be.calledWith("OLD_VERSION_OF_CLI")
        expect(errors.warning).to.be.calledWith("CYPRESS_CI_DEPRECATED")
        expect(errors.warning).not.to.be.calledWith("PROJECT_ID_AND_KEY_BUT_MISSING_RECORD_OPTION")

    it "logs warning when using deprecated --ci arg and env var", ->
      @setup()

      process.env.CYPRESS_CI_KEY = "asdf123foobarbaz"

      @createRun.resolves("build-id-123")
      @sandbox.stub(api, "createInstance").resolves()
      @sandbox.stub(api, "updateInstance").resolves()

      cypress.start(["--run-project=#{@todosPath}", "--cli-version=0.19.0", "--key=token-123", "--ci"])
      .then =>
        delete process.env.CYPRESS_CI_KEY

        expect(errors.warning).not.to.be.calledWith("OLD_VERSION_OF_CLI")
        expect(errors.warning).to.be.calledWith("CYPRESS_CI_DEPRECATED_ENV_VAR")
        expect(console.log).to.be.calledWithMatch("You are using the deprecated command:")
        expect(console.log).to.be.calledWithMatch("cypress ci")
        expect(console.log).to.be.calledWithMatch("cypress run --record")

    it "logs error when missing project id", ->
      @setup()

      cypress.start(["--run-project=#{@pristinePath}", "--record", "--key=token-123"])
      .then =>
        @expectExitWithErr("CANNOT_RECORD_NO_PROJECT_ID")

    it "logs error and exits when ci key is not valid", ->
      @setup()

      err = new Error()
      err.statusCode = 401
      @createRun.rejects(err)

      cypress.start(["--run-project=#{@todosPath}", "--record", "--key=token-123"])
      .then =>
        @expectExitWithErr("RECORD_KEY_NOT_VALID", "token...n-123")

    it "logs error and exits when project could not be found", ->
      @setup()

      err = new Error()
      err.statusCode = 404
      @createRun.rejects(err)

      cypress.start(["--run-project=#{@todosPath}", "--record", "--key=token-123"])
      .then =>
        @expectExitWithErr("DASHBOARD_PROJECT_NOT_FOUND", "abc123")

    it "logs error but continues running the tests", ->
      @setup()

      err = new Error()
      err.statusCode = 500
      @createRun.rejects(err)

      cypress.start(["--run-project=#{@todosPath}", "--record", "--key=token-123"])
      .then =>
        @expectExitWith(3)

    it "throws when no Record Key was provided", ->
      @setup()

      cypress.start(["--run-project=#{@todosPath}", "--cli-version=0.19.0", "--record"])
      .then =>
        @expectExitWithErr("RECORD_KEY_MISSING", "cypress run --record --key <record_key>")

  context "--return-pkg", ->
    beforeEach ->
      console.log.restore()
      @sandbox.stub(console, "log")

    it "logs package.json and exits", ->
      cypress.start(["--return-pkg"])
      .then =>
        expect(console.log).to.be.calledWithMatch('{"name":"cypress"')
        @expectExitWith(0)

  context "--version", ->
    beforeEach ->
      console.log.restore()
      @sandbox.stub(console, "log")

    it "logs version and exits", ->
      cypress.start(["--version"])
      .then =>
        expect(console.log).to.be.calledWith(pkg.version)
        @expectExitWith(0)

  context "--smoke-test", ->
    beforeEach ->
      console.log.restore()
      @sandbox.stub(console, "log")

    it "logs pong value and exits", ->
      cypress.start(["--smoke-test", "--ping=abc123"])
      .then =>
        expect(console.log).to.be.calledWith("abc123")
        @expectExitWith(0)

  context "--remove-ids", ->
    it "logs stats", ->
      idsPath = Fixtures.projectPath("ids")

      cypress.start(["--remove-ids", "--run-project=#{idsPath}"])
      .then =>
        expect(console.log).to.be.calledWith("Removed '5' ids from '2' files.")
        @expectExitWith(0)

    it "catches errors when project is not found", ->
      cypress.start(["--remove-ids", "--run-project=path/to/no/project"])
      .then =>
        @expectExitWithErr("NO_PROJECT_FOUND_AT_PROJECT_ROOT", "path/to/no/project")

  context "headed", ->
    beforeEach ->
      @win = {
        on: @sandbox.stub()
        webContents: {
          on: @sandbox.stub()
        }
      }

      @sandbox.stub(electron.app, "on").withArgs("ready").yieldsAsync()
      @sandbox.stub(Windows, "open").resolves(@win)
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

    it "passes filtered options to Project#open and sets cli config", ->
      getConfig = @sandbox.spy(Project.prototype, "getConfig")
      open      = @sandbox.stub(Server.prototype, "open").resolves([])

      process.env.CYPRESS_FILE_SERVER_FOLDER = "foo"
      process.env.CYPRESS_BASE_URL = "localhost"
      process.env.CYPRESS_port = "2222"
      process.env.CYPRESS_responseTimeout = "5555"
      process.env.CYPRESS_watch_for_file_changes = "false"

      Promise.all([
        user.set({name: "brian", authToken: "auth-token-123"}),

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

    it "sends warning when baseUrl cannot be verified", ->
      bus = new EventEmitter()
      event = { sender: { send: @sandbox.stub() } }
      warning = { message: "Blah blah baseUrl blah blah" }
      open = @sandbox.stub(Server.prototype, "open").resolves([2121, warning])

      cypress.start(["--port=2121", "--config", "pageLoadTimeout=1000", "--foo=bar", "--env=baz=baz"])
      .then =>
        options = Events.start.firstCall.args[0]
        Events.handleEvent(options, bus, event, 123, "on:project:warning")
        Events.handleEvent(options, bus, event, 123, "open:project", @todosPath)
      .then ->
        expect(event.sender.send.withArgs("response").firstCall.args[1].data).to.eql(warning)

  context "no args", ->
    beforeEach ->
      @sandbox.stub(electron.app, "on").withArgs("ready").yieldsAsync()
      @sandbox.stub(headed, "ready").resolves()

    it "runs headed and does not exit", ->
      cypress.start().then ->
        expect(headed.ready).to.be.calledOnce
