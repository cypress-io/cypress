require("../spec_helper")

_          = require("lodash")
os         = require("os")
cp         = require("child_process")
path       = require("path")
EE         = require("events")
http       = require("http")
Promise    = require("bluebird")
electron   = require("electron")
commitInfo = require("@cypress/commit-info")
Fixtures   = require("../support/helpers/fixtures")
pkg        = require("@packages/root")
launcher   = require("@packages/launcher")
extension  = require("@packages/extension")
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
upload     = require("#{root}lib/upload")
cypress    = require("#{root}lib/cypress")
Project    = require("#{root}lib/project")
Server     = require("#{root}lib/server")
Reporter   = require("#{root}lib/reporter")
utils      = require("#{root}lib/browsers/utils")
browsers   = require("#{root}lib/browsers")
Watchers   = require("#{root}lib/watchers")
openProject   = require("#{root}lib/open_project")
appData       = require("#{root}lib/util/app_data")
formStatePath = require("#{root}lib/util/saved_state").formStatePath

TYPICAL_BROWSERS = [
  {
    name: 'chrome',
    displayName: 'Chrome',
    version: '60.0.3112.101',
    path: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    majorVersion: '60'
  }, {
    name: 'chromium',
    displayName: 'Chromium',
    version: '49.0.2609.0',
    path: '/Users/bmann/Downloads/chrome-mac/Chromium.app/Contents/MacOS/Chromium',
    majorVersion: '49'
  }, {
    name: 'canary',
    displayName: 'Canary',
    version: '62.0.3197.0',
    path: '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    majorVersion: '62'
  }, {
    name: 'electron',
    version: '',
    path: '',
    majorVersion: '',
    info: 'Electron is the default browser that comes with Cypress. This is the browser that runs in headless mode. Selecting this browser is useful when debugging. The version number indicates the underlying Chromium version that Electron uses.'
  }
]

describe "lib/cypress", ->
  require("mocha-banner").register()

  beforeEach ->
    @timeout(5000)

    cache.__removeSync()

    Fixtures.scaffold()
    @todosPath    = Fixtures.projectPath("todos")
    @pristinePath = Fixtures.projectPath("pristine")
    @noScaffolding = Fixtures.projectPath("no-scaffolding")
    @pluginConfig = Fixtures.projectPath("plugin-config")
    @pluginBrowser = Fixtures.projectPath("plugin-browser")
    @idsPath      = Fixtures.projectPath("ids")

    ## force cypress to call directly into main without
    ## spawning a separate process
    @sandbox.stub(cypress, "isCurrentlyRunningElectron").returns(true)
    @sandbox.stub(extension, "setHostAndPath").resolves()
    @sandbox.stub(launcher, "detect").resolves(TYPICAL_BROWSERS)
    @sandbox.stub(process, "exit")
    @sandbox.stub(Server.prototype, "reset")
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
      @sandbox.stub(commitInfo, "getRemoteOrigin").resolves("remoteOrigin")

    it "runs project headlessly and exits with exit code 0", ->
      cypress.start(["--run-project=#{@todosPath}"])
      .then =>
        expect(browsers.open).to.be.calledWithMatch("electron", {url: "http://localhost:8888/__/#/tests/__all"})
        @expectExitWith(0)

    it "runs project headlessly and exits with exit code 10", ->
      headless.listenForProjectEnd.resolves({failures: 10})

      cypress.start(["--run-project=#{@todosPath}"])
      .then =>
        expect(browsers.open).to.be.calledWithMatch("electron", {url: "http://localhost:8888/__/#/tests/__all"})
        @expectExitWith(10)

    it "does not generate a project id even if missing one", ->
      @sandbox.stub(api, "createProject")

      user.set({authToken: "auth-token-123"})
      .then =>
        cypress.start(["--run-project=#{@noScaffolding}"])
      .then =>
        @expectExitWith(0)
      .then =>
        expect(api.createProject).not.to.be.called

        Project(@noScaffolding).getProjectId()
        .then ->
          throw new Error("should have caught error but didnt")
        .catch (err) ->
          expect(err.type).to.eq("NO_PROJECT_ID")

    it "does not add project to the global cache", ->
      cache.getProjectPaths()
      .then (projects) =>
        ## no projects in the cache
        expect(projects.length).to.eq(0)

        cypress.start(["--run-project=#{@todosPath}"])
      .then ->
        cache.getProjectPaths()
      .then (projects) ->
        ## still not projects
        expect(projects.length).to.eq(0)

    it "runs project by relative spec and exits with status 0", ->
      relativePath = path.relative(cwd(), @todosPath)

      cypress.start(["--run-project=#{@todosPath}", "--spec=#{relativePath}/tests/test2.coffee"])
      .then =>
        expect(browsers.open).to.be.calledWithMatch("electron", {url: "http://localhost:8888/__/#/tests/integration/test2.coffee"})
        @expectExitWith(0)

    it "runs project by specific spec with default configuration", ->
      cypress.start(["--run-project=#{@idsPath}", "--spec=#{@idsPath}/cypress/integration/bar.js", "--config", "port=2020"])
      .then =>
        expect(browsers.open).to.be.calledWithMatch("electron", {url: "http://localhost:2020/__/#/tests/integration/bar.js"})
        @expectExitWith(0)

    it "runs project by specific absolute spec and exits with status 0", ->
      cypress.start(["--run-project=#{@todosPath}", "--spec=#{@todosPath}/tests/test2.coffee"])
      .then =>
        expect(browsers.open).to.be.calledWithMatch("electron", {url: "http://localhost:8888/__/#/tests/integration/test2.coffee"})
        @expectExitWith(0)

    it "scaffolds out integration and example_spec if they do not exist when not headless", ->
      config.get(@pristinePath)
      .then (cfg) =>
        fs.statAsync(cfg.integrationFolder)
        .then ->
          throw new Error("integrationFolder should not exist!")
        .catch =>
          cypress.start(["--run-project=#{@pristinePath}", "--no-headless"])
        .then =>
          fs.statAsync(cfg.integrationFolder)
        .then =>
          fs.statAsync path.join(cfg.integrationFolder, "example_spec.js")

    it "does not scaffold when headless and exits with error when no existing project", ->
      ensureDoesNotExist = (inspection, index) ->
        if not inspection.isRejected()
          throw new Error("File or folder was scaffolded at index: #{index}")

        expect(inspection.reason()).to.have.property("code", "ENOENT")

      Promise.all([
        fs.statAsync(path.join(@pristinePath, "cypress")).reflect()
        fs.statAsync(path.join(@pristinePath, "cypress.json")).reflect()
      ])
      .each(ensureDoesNotExist)
      .then =>
        cypress.start(["--run-project=#{@pristinePath}"])
      .then =>
        Promise.all([
          fs.statAsync(path.join(@pristinePath, "cypress")).reflect()
          fs.statAsync(path.join(@pristinePath, "cypress.json")).reflect()
        ])
      .each(ensureDoesNotExist)
      .then =>
        @expectExitWithErr("PROJECT_DOES_NOT_EXIST", @pristinePath)

    it "does not scaffold integration or example_spec when headless", ->
      settings.write(@pristinePath, {})
      .then =>
        cypress.start(["--run-project=#{@pristinePath}"])
      .then =>
        fs.statAsync(path.join(@pristinePath, "cypress", "integration"))
      .then =>
        throw new Error("integration folder should not exist!")
      .catch {code: "ENOENT"}, =>

    it "scaffolds out fixtures + files if they do not exist", ->
      config.get(@pristinePath)
      .then (cfg) =>
        fs.statAsync(cfg.fixturesFolder)
        .then ->
          throw new Error("fixturesFolder should not exist!")
        .catch =>
          cypress.start(["--run-project=#{@pristinePath}", "--no-headless"])
        .then =>
          fs.statAsync(cfg.fixturesFolder)
        .then =>
          fs.statAsync path.join(cfg.fixturesFolder, "example.json")

    it "scaffolds out support + files if they do not exist", ->
      supportFolder = path.join(@pristinePath, "cypress/support")

      config.get(@pristinePath)
      .then (cfg) =>
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

    it "removes fixtures when they exist and fixturesFolder is false", (done) ->
      config.get(@idsPath)
      .then (@cfg) =>
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

    it "runs project headlessly and displays gui", ->
      cypress.start(["--run-project=#{@todosPath}", "--headed"])
      .then =>
        expect(browsers.open).to.be.calledWithMatch("electron", {
          url: "http://localhost:8888/__/#/tests/__all"
          proxyServer: "http://localhost:8888"
          show: true
        })
        @expectExitWith(0)

    it "turns on reporting", ->
      @sandbox.spy(Reporter, "create")

      cypress.start(["--run-project=#{@todosPath}"])
      .then  =>
        expect(Reporter.create).to.be.calledWith("spec")
        @expectExitWith(0)

    it "can change the reporter to nyan", ->
      @sandbox.spy(Reporter, "create")

      cypress.start(["--run-project=#{@todosPath}", "--reporter=nyan"])
      .then  =>
        expect(Reporter.create).to.be.calledWith("nyan")
        @expectExitWith(0)

    it "can change the reporter with cypress.json", ->
      @sandbox.spy(Reporter, "create")

      config.get(@idsPath)
      .then (@cfg) =>
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
      user.set({})
      .then =>
        cypress.start(["--run-project=#{@todosPath}"])
      .then =>
        @expectExitWith(0)

    it "logs warning when projectId and key but no record option", ->
      cypress.start(["--run-project=#{@todosPath}", "--key=asdf"])
      .then =>
        expect(errors.warning).to.be.calledWith("PROJECT_ID_AND_KEY_BUT_MISSING_RECORD_OPTION", "abc123")
        expect(console.log).to.be.calledWithMatch("You also provided your Record Key, but you did not pass the --record flag.")
        expect(console.log).to.be.calledWithMatch("cypress run --record")
        expect(console.log).to.be.calledWithMatch("https://on.cypress.io/recording-project-runs")

    it "does not log warning when no projectId", ->
      cypress.start(["--run-project=#{@pristinePath}", "--key=asdf"])
      .then =>
        expect(errors.warning).not.to.be.calledWith("PROJECT_ID_AND_KEY_BUT_MISSING_RECORD_OPTION", "abc123")
        expect(console.log).not.to.be.calledWithMatch("cypress run --key <record_key>")

    it "does not log warning when projectId but --record false", ->
      cypress.start(["--run-project=#{@todosPath}", "--key=asdf", "--record=false"])
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
      settings.write(@idsPath, {supportFile: "/does/not/exist"})
      .then =>
        cypress.start(["--run-project=#{@idsPath}"])
      .then =>
        @expectExitWithErr("SUPPORT_FILE_NOT_FOUND", "Your supportFile is set to '/does/not/exist',")

    it "logs error when browser cannot be found", ->
      browsers.open.restore()

      cypress.start(["--run-project=#{@idsPath}", "--browser=foo"])
      .then =>
        @expectExitWithErr("BROWSER_NOT_FOUND")

        ## get all the error args
        argsSet = errors.log.args

        found1 = _.find argsSet, (args) ->
          _.find args, (arg) ->
            arg.message and arg.message.includes(
              "Browser: 'foo' was not found on your system."
            )

        expect(found1, "foo should not be found").to.be.ok

        found2 = _.find argsSet, (args) ->
          _.find args, (arg) ->
            arg.message and arg.message.includes(
              "Available browsers found are: chrome, chromium, canary, electron"
            )

        expect(found2, "browser names should be listed").to.be.ok

    it "logs error and exits when spec file was specified and does not exist", ->
      cypress.start(["--run-project=#{@todosPath}", "--spec=path/to/spec"])
      .then =>
        @expectExitWithErr("SPEC_FILE_NOT_FOUND", "#{cwd()}/path/to/spec")

    it "logs error and exits when spec absolute file was specified and does not exist", ->
      cypress.start(["--run-project=#{@todosPath}", "--spec=#{@todosPath}/tests/path/to/spec"])
      .then =>
        @expectExitWithErr("SPEC_FILE_NOT_FOUND", "#{@todosPath}/tests/path/to/spec")

    it "logs error and exits when project has cypress.json syntax error", ->
      fs.writeFileAsync(@todosPath + "/cypress.json", "{'foo': 'bar}")
      .then =>
        cypress.start(["--run-project=#{@todosPath}"])
      .then =>
        @expectExitWithErr("ERROR_READING_FILE", @todosPath)

    it "logs error and exits when project has cypress.env.json syntax error", ->
      fs.writeFileAsync(@todosPath + "/cypress.env.json", "{'foo': 'bar}")
      .then =>
        cypress.start(["--run-project=#{@todosPath}"])
      .then =>
        @expectExitWithErr("ERROR_READING_FILE", @todosPath)

    it "logs error and exits when project has invalid cypress.json values", ->
      settings.write(@todosPath, {baseUrl: "localhost:9999"})
      .then =>
        cypress.start(["--run-project=#{@todosPath}"])
      .then =>
        @expectExitWithErr("CONFIG_VALIDATION_ERROR", "cypress.json")

    it "logs error and exits when baseUrl cannot be verified", ->
      settings.write(@todosPath, {baseUrl: "http://localhost:90874"})
      .then =>
        cypress.start(["--run-project=#{@todosPath}"])
      .then =>
        @expectExitWithErr("CANNOT_CONNECT_BASE_URL", "http://localhost:90874")

    ## TODO: make sure we have integration tests around this
    ## for headed projects!
    ## also make sure we test the rest of the integration functionality
    ## for headed errors! <-- not unit tests, but integration tests!
    it "logs error and exits when project folder has read permissions only and cannot write cypress.json", ->
      if process.env.CI
        ## Gleb: disabling this because Node 8 docker image runs as root
        ## which makes accessing everything possible.
        return

      permissionsPath = path.resolve("./permissions")

      cypressJson = path.join(permissionsPath, "cypress.json")

      fs.outputFileAsync(cypressJson, "{}")
      .then =>
        ## read only
        fs.chmodAsync(permissionsPath, "555")
      .then =>
        cypress.start(["--run-project=#{permissionsPath}"])
      .then =>
        fs.chmodAsync(permissionsPath, "777")
      .then =>
        fs.removeAsync(permissionsPath)
      .then =>
        @expectExitWithErr("ERROR_READING_FILE", path.join(permissionsPath, "cypress.json"))

    it "logs error and exits when reporter does not exist", ->
      cypress.start(["--run-project=#{@todosPath}", "--reporter", "foobarbaz"])
      .then =>
        @expectExitWithErr("INVALID_REPORTER_NAME", "foobarbaz")

    describe "state", ->
      statePath = null
      beforeEach ->
        formStatePath(@todosPath)
        .then (statePathStart) ->
          statePath = appData.projectsPath(statePathStart)
          fs.pathExists(statePath)
          .then (found) ->
            if found
              fs.unlink(statePath)

      afterEach ->
        fs.unlink(statePath)

      it "saves project state", ->
        cypress.start(["--run-project=#{@todosPath}", "--spec=#{@todosPath}/tests/test2.coffee"])
        .then =>
          @expectExitWith(0)
        .then ->
          openProject.getProject().saveState()
        .then () ->
          fs.pathExists(statePath)
        .then (found) ->
          expect(found, "Finds saved stage file #{statePath}").to.be.true

    describe "morgan", ->
      it "sets morgan to false", ->
        cypress.start(["--run-project=#{@todosPath}"])
        .then =>
          expect(openProject.getProject().cfg.morgan).to.be.false
          @expectExitWith(0)

    describe "config overrides", ->
      it "can override default values", ->
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

      it "can override values in plugins", ->
        cypress.start([
          "--run-project=#{@pluginConfig}", "--config=requestTimeout=1234,videoCompression=false"
          "--env=foo=foo,bar=bar"
        ])
        .then =>
          cfg = openProject.getProject().cfg

          expect(cfg.videoCompression).to.eq(20)
          expect(cfg.defaultCommandTimeout).to.eq(500)
          expect(cfg.env).to.deep.eq({
            foo: "bar"
            bar: "bar"
          })

          expect(cfg.resolved.videoCompression).to.deep.eq({
            value: 20
            from: "plugin"
          })
          expect(cfg.resolved.requestTimeout).to.deep.eq({
            value: 1234
            from: "cli"
          })
          expect(cfg.resolved.env.foo).to.deep.eq({
            value: "bar"
            from: "plugin"
          })
          expect(cfg.resolved.env.bar).to.deep.eq({
            value: "bar"
            from: "cli"
          })

          @expectExitWith(0)

    describe "plugins", ->
      beforeEach ->
        browsers.open.restore()

        ee = new EE()
        ee.kill = ->
          ee.emit("exit")
        ee.close = ->
          ee.emit("closed")
        ee.isDestroyed = -> false
        ee.loadURL = ->
        ee.webContents = {
          session: {
            clearCache: @sandbox.stub().yieldsAsync()
          }
        }

        @sandbox.stub(utils, "launch").resolves(ee)
        @sandbox.stub(Windows, "create").returns(ee)
        @sandbox.stub(Windows, "automation")

      context "before:browser:launch", ->
        it "chrome", ->
          cypress.start([
            "--run-project=#{@pluginBrowser}"
            "--browser=chrome"
          ])
          .then =>
            args = utils.launch.firstCall.args

            expect(args[0]).to.eq("chrome")

            browserArgs = args[2]

            expect(browserArgs).to.have.length(7)

            expect(browserArgs.slice(0, 4)).to.deep.eq([
              "chrome", "foo", "bar", "baz"
            ])

            @expectExitWith(0)

        it "electron", ->
          cypress.start([
            "--run-project=#{@pluginBrowser}"
            "--browser=electron"
          ])
          .then =>
            expect(Windows.create).to.be.calledWith(@pluginBrowser, {
              browser: "electron"
              foo: "bar"
            })

            @expectExitWith(0)

    describe "--port", ->
      beforeEach ->
        headless.listenForProjectEnd.resolves({failures: 0})

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

      afterEach ->
        process.env = @env

      it "can set specific environment variables", ->
        cypress.start([
          "--run-project=#{@todosPath}",
          "--videoRecording=false"
          "--env",
          "version=0.12.1,foo=bar,host=http://localhost:8888,baz=quux=dolor"
        ])
        .then =>
          expect(openProject.getProject().cfg.env).to.deep.eq({
            version: "0.12.1"
            foo: "bar"
            host: "http://localhost:8888"
            baz: "quux=dolor"
          })

          @expectExitWith(0)

  ## the majority of the logic in Record mode is covered already
  ## in --run-project specs above
  context "--record or --ci", ->
    afterEach ->
      delete process.env.CYPRESS_PROJECT_ID
      delete process.env.CYPRESS_RECORD_KEY

    beforeEach ->
      @setup = (specPattern, specFiles) =>
        if not specFiles
          specFiles = ["a-spec.js", "b-spec.js"]

          @sandbox.stub(Project, "findSpecs").resolves(specFiles)

        createRunArgs = {
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
          groupId: null
          specs: specFiles
          specPattern: specPattern
        }

        @createRun = @sandbox.stub(api, "createRun").withArgs(createRunArgs)

      @sandbox.stub(upload, "send").resolves()
      @sandbox.stub(stdout, "capture").returns({
        toString: -> "foobarbaz"
      })

      @sandbox.stub(ciProvider, "name").returns("travis")
      @sandbox.stub(ciProvider, "buildNum").returns("987")
      @sandbox.stub(ciProvider, "params").returns(null)
      @sandbox.stub(os, "platform").returns("linux")
      ## TODO: might need to change this to a different return
      @sandbox.stub(electron.app, "on").withArgs("ready").yieldsAsync()
      @sandbox.stub(commitInfo, "commitInfo").resolves({
        branch: "bem/ci",
        sha: "sha-123",
        author: "brian",
        email: "brian@cypress.io",
        message: "foo",
        remote: "https://github.com/foo/bar.git"
      })
      @sandbox.stub(browsers, "open")
      @sandbox.stub(headless, "waitForSocketConnection")
      @sandbox.stub(headless, "waitForTestsToFinishRunning").resolves({
        tests: 1
        passes: 2
        failures: 3
        pending: 4
        duration: 5
        video: true
        shouldUploadVideo: true
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

    it "runs project in ci and exits with number of failures", ->
      @setup()

      @createRun.resolves("build-id-123")

      @createInstance = @sandbox.stub(api, "createInstance").withArgs({
        buildId: "build-id-123"
        browser: "electron"
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
      }).resolves({
        videoUploadUrl: "http://video.url"
      })

      cypress.start(["--run-project=#{@todosPath}", "--record",  "--key=token-123"])
      .then =>
        expect(@createInstance).to.be.calledOnce
        expect(@updateInstance).to.be.calledOnce

        expect(upload.send).to.be.calledOnce

        @expectExitWith(3)

    it "sends specs and runs project by specific absolute spec and exits with status 3", ->
      spec = "#{@todosPath}/tests/*"

      @setup(spec, [
        "test1.js"
        "test2.coffee"
      ])

      ## TODO: fix this once we implement proper globbing
      ## per spec. currently just hacking this and forcing
      ## it to return something we specify
      @sandbox.stub(Project.prototype, "ensureSpecExists").resolves("#{@todosPath}/test2.coffee")

      @createRun.resolves("build-id-123")

      @sandbox.stub(api, "createInstance").withArgs({
        buildId: "build-id-123"
        browser: "chrome"
        spec: spec
      }).resolves("instance-id-123")

      @updateInstance = @sandbox.stub(api, "updateInstance").resolves()

      cypress.start(["--run-project=#{@todosPath}", "--record", "--key=token-123", "--spec=#{spec}", "--browser=chrome"])
      .then =>
        expect(browsers.open).to.be.calledWithMatch("chrome", {url: "http://localhost:8888/__/#/tests/test2.coffee"})
        @expectExitWith(3)

    it "uses process.env.CYPRESS_PROJECT_ID", ->
      @setup()

      ## set the projectId to be todos even though
      ## we are running the pristine project
      process.env.CYPRESS_PROJECT_ID = @projectId

      @createRun.resolves()
      @sandbox.stub(api, "createInstance").resolves()

      cypress.start(["--run-project=#{@pristinePath}", "--record", "--key=token-123"])
      .then =>
        expect(errors.warning).not.to.be.called
        @expectExitWith(3)

    it "uses process.env.CYPRESS_RECORD_KEY", ->
      @setup()

      process.env.CYPRESS_RECORD_KEY = "token-123"

      @createRun.resolves()
      @sandbox.stub(api, "createInstance").resolves()

      cypress.start(["--run-project=#{@todosPath}", "--record"])
      .then =>
        expect(errors.warning).not.to.be.called
        @expectExitWith(3)

    it "still records even with old --ci option", ->
      @setup()

      @createRun.resolves("build-id-123")
      @sandbox.stub(api, "createInstance").resolves()
      @sandbox.stub(api, "updateInstance").resolves()

      cypress.start(["--run-project=#{@todosPath}", "--key=token-123", "--ci"])
      .then =>
        @expectExitWith(3)

    it "logs warning when using deprecated --ci arg and no env var", ->
      @setup()

      @createRun.resolves("build-id-123")
      @sandbox.stub(api, "createInstance").resolves()
      @sandbox.stub(api, "updateInstance").resolves()

      cypress.start(["--run-project=#{@todosPath}", "--key=token-123", "--ci"])
      .then =>
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
        expect(errors.warning).to.be.calledWith("CYPRESS_CI_DEPRECATED")
        expect(errors.warning).not.to.be.calledWith("PROJECT_ID_AND_KEY_BUT_MISSING_RECORD_OPTION")

    it "logs warning when using deprecated --ci arg and env var", ->
      @setup()

      process.env.CYPRESS_CI_KEY = "asdf123foobarbaz"

      @createRun.resolves("build-id-123")
      @sandbox.stub(api, "createInstance").resolves()
      @sandbox.stub(api, "updateInstance").resolves()

      cypress.start(["--run-project=#{@todosPath}", "--key=token-123", "--ci"])
      .then =>
        delete process.env.CYPRESS_CI_KEY

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

      cypress.start(["--run-project=#{@todosPath}", "--record"])
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
          config: {
            port: 2121
            pageLoadTimeout: 1000
          }
        })

    it "passes options to Events.start", ->
      cypress.start(["--port=2121", "--config=pageLoadTimeout=1000"])
      .then ->
        expect(Events.start).to.be.calledWithMatch({
          port: 2121,
          config: {
            pageLoadTimeout: 1000
            port: 2121
          }
        })

    it "passes filtered options to Project#open and sets cli config", ->
      getConfig = @sandbox.spy(Project.prototype, "getConfig")
      open      = @sandbox.stub(Server.prototype, "open").resolves([])

      process.env.CYPRESS_FILE_SERVER_FOLDER = "foo"
      process.env.CYPRESS_BASE_URL = "localhost"
      process.env.CYPRESS_port = "2222"
      process.env.CYPRESS_responseTimeout = "5555"
      process.env.CYPRESS_watch_for_file_changes = "false"

      user.set({name: "brian", authToken: "auth-token-123"})
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
          env: { baz: "baz" }
        })

        cfg = open.getCall(0).args[0]

        expect(cfg.fileServerFolder).to.eq(path.join(@todosPath, "foo"))
        expect(cfg.pageLoadTimeout).to.eq(1000)
        expect(cfg.port).to.eq(2121)
        expect(cfg.baseUrl).to.eq("localhost")
        expect(cfg.watchForFileChanges).to.be.false
        expect(cfg.responseTimeout).to.eq(5555)
        expect(cfg.env.baz).to.eq("baz")
        expect(cfg.env).not.to.have.property("fileServerFolder")
        expect(cfg.env).not.to.have.property("port")
        expect(cfg.env).not.to.have.property("BASE_URL")
        expect(cfg.env).not.to.have.property("watchForFileChanges")
        expect(cfg.env).not.to.have.property("responseTimeout")

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
        expect(cfg.resolved.env.baz).to.deep.eq({
          value: "baz"
          from: "cli"
        })

    it "sends warning when baseUrl cannot be verified", ->
      bus = new EE()
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
