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
snapshot   = require("snap-shot-it")
stripAnsi  = require("strip-ansi")
pkg        = require("@packages/root")
launcher   = require("@packages/launcher")
extension  = require("@packages/extension")
argsUtil   = require("#{root}lib/util/args")
fs         = require("#{root}lib/util/fs")
ciProvider = require("#{root}lib/util/ci_provider")
settings   = require("#{root}lib/util/settings")
Events     = require("#{root}lib/gui/events")
Windows    = require("#{root}lib/gui/windows")
record     = require("#{root}lib/modes/record")
interactiveMode = require("#{root}lib/modes/interactive")
runMode   = require("#{root}lib/modes/run")
api        = require("#{root}lib/api")
cwd        = require("#{root}lib/cwd")
user       = require("#{root}lib/user")
config     = require("#{root}lib/config")
cache      = require("#{root}lib/cache")
errors     = require("#{root}lib/errors")
plugins    = require("#{root}lib/plugins")
cypress    = require("#{root}lib/cypress")
Project    = require("#{root}lib/project")
Server     = require("#{root}lib/server")
Reporter   = require("#{root}lib/reporter")
Watchers   = require("#{root}lib/watchers")
browsers   = require("#{root}lib/browsers")
videoCapture = require("#{root}lib/video_capture")
browserUtils = require("#{root}lib/browsers/utils")
chromeBrowser = require("#{root}lib/browsers/chrome")
openProject   = require("#{root}lib/open_project")
env           = require("#{root}lib/util/env")
system        = require("#{root}lib/util/system")
appData       = require("#{root}lib/util/app_data")
formStatePath = require("#{root}lib/util/saved_state").formStatePath

TYPICAL_BROWSERS = [
  {
    name: 'chrome',
    family: 'chrome',
    displayName: 'Chrome',
    version: '60.0.3112.101',
    path: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    majorVersion: '60'
  }, {
    name: 'chromium',
    family: 'chrome',
    displayName: 'Chromium',
    version: '49.0.2609.0',
    path: '/Users/bmann/Downloads/chrome-mac/Chromium.app/Contents/MacOS/Chromium',
    majorVersion: '49'
  }, {
    name: 'canary',
    family: 'chrome',
    displayName: 'Canary',
    version: '62.0.3197.0',
    path: '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    majorVersion: '62'
  }
]

ELECTRON_BROWSER = {
  name: "electron"
  family: "electron"
  displayName: "Electron"
  path: ""
}

previousCwd = process.cwd()

snapshotConsoleLogs = (name) ->
  args = _
  .chain(console.log.args)
  .map (innerArgs) ->
    innerArgs.join(" ")
  .join("\n")
  .value()

  ## our cwd() is currently the project
  ## so must switch back to original
  process.chdir(previousCwd)

  snapshot(name, stripAnsi(args))

describe "lib/cypress", ->
  require("mocha-banner").register()

  beforeEach ->
    @timeout(5000)

    cache.__removeSync()

    Fixtures.scaffold()
    @todosPath    = Fixtures.projectPath("todos")
    @pristinePath = Fixtures.projectPath("pristine")
    @noScaffolding = Fixtures.projectPath("no-scaffolding")
    @recordPath = Fixtures.projectPath("record")
    @pluginConfig = Fixtures.projectPath("plugin-config")
    @pluginBrowser = Fixtures.projectPath("plugin-browser")
    @idsPath      = Fixtures.projectPath("ids")

    ## force cypress to call directly into main without
    ## spawning a separate process
    sinon.stub(videoCapture, "start").resolves({})
    sinon.stub(plugins, "init").resolves(undefined)
    sinon.stub(cypress, "isCurrentlyRunningElectron").returns(true)
    sinon.stub(extension, "setHostAndPath").resolves()
    sinon.stub(launcher, "detect").resolves(TYPICAL_BROWSERS)
    sinon.stub(process, "exit")
    sinon.stub(Server.prototype, "reset")
    sinon.stub(errors, "warning")
    .callThrough()
    .withArgs("INVOKED_BINARY_OUTSIDE_NPM_MODULE")
    .returns(null)

    sinon.spy(errors, "log")
    sinon.spy(errors, "logException")
    sinon.spy(console, "log")

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
        sinon.stub(api, "getProjectToken")
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
        sinon.stub(api, "getProjectToken")
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
        sinon.stub(api, "updateProjectToken")
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
        sinon.stub(api, "updateProjectToken")
          .withArgs(@projectId, "auth-token-123")
          .rejects(new Error())

        cypress.start(["--new-key", "--project=#{@todosPath}"])
      .then =>
        @expectExitWithErr("CANNOT_CREATE_PROJECT_TOKEN")

  context "--run-project", ->
    beforeEach ->
      sinon.stub(electron.app, "on").withArgs("ready").yieldsAsync()
      sinon.stub(runMode, "waitForSocketConnection")
      sinon.stub(runMode, "listenForProjectEnd").resolves({stats: {failures: 0} })
      sinon.stub(browsers, "open")
      sinon.stub(commitInfo, "getRemoteOrigin").resolves("remoteOrigin")

    it "runs project headlessly and exits with exit code 0", ->
      cypress.start(["--run-project=#{@todosPath}"])
      .then =>
        expect(browsers.open).to.be.calledWithMatch(ELECTRON_BROWSER)
        @expectExitWith(0)

    it "runs project headlessly and exits with exit code 10", ->
      sinon.stub(runMode, "runSpecs").resolves({ totalFailed: 10 })

      cypress.start(["--run-project=#{@todosPath}"])
      .then =>
        @expectExitWith(10)

    it "does not generate a project id even if missing one", ->
      sinon.stub(api, "createProject")

      user.set({authToken: "auth-token-123"})
      .then =>
        cypress.start(["--run-project=#{@noScaffolding}"])
      .then =>
        @expectExitWith(0)
      .then =>
        expect(api.createProject).not.to.be.called

        Project(@noScaffolding).getProjectId()
        .then ->
          throw new Error("should have caught error but did not")
        .catch (err) ->
          expect(err.type).to.eq("NO_PROJECT_ID")

    it "does not add project to the global cache", ->
      cache.getProjectRoots()
      .then (projects) =>
        ## no projects in the cache
        expect(projects.length).to.eq(0)

        cypress.start(["--run-project=#{@todosPath}"])
      .then ->
        cache.getProjectRoots()
      .then (projects) ->
        ## still not projects
        expect(projects.length).to.eq(0)

    it "runs project by relative spec and exits with status 0", ->
      relativePath = path.relative(cwd(), @todosPath)

      cypress.start([
        "--run-project=#{@todosPath}",
        "--spec=#{relativePath}/tests/test2.coffee"
      ])
      .then =>
        expect(browsers.open).to.be.calledWithMatch(ELECTRON_BROWSER, {
          url: "http://localhost:8888/__/#/tests/integration/test2.coffee"
        })
        @expectExitWith(0)

    it "runs project by specific spec with default configuration", ->
      cypress.start(["--run-project=#{@idsPath}", "--spec=#{@idsPath}/cypress/integration/bar.js", "--config", "port=2020"])
      .then =>
        expect(browsers.open).to.be.calledWithMatch(ELECTRON_BROWSER, {url: "http://localhost:2020/__/#/tests/integration/bar.js"})
        @expectExitWith(0)

    it "runs project by specific absolute spec and exits with status 0", ->
      cypress.start(["--run-project=#{@todosPath}", "--spec=#{@todosPath}/tests/test2.coffee"])
      .then =>
        expect(browsers.open).to.be.calledWithMatch(ELECTRON_BROWSER, {url: "http://localhost:8888/__/#/tests/integration/test2.coffee"})
        @expectExitWith(0)

    it "runs project by limiting spec files via config.testFiles string glob pattern", ->
      cypress.start(["--run-project=#{@todosPath}", "--config=testFiles=#{@todosPath}/tests/test2.coffee"])
      .then =>
        expect(browsers.open).to.be.calledWithMatch(ELECTRON_BROWSER, {url: "http://localhost:8888/__/#/tests/integration/test2.coffee"})
        @expectExitWith(0)

    it "runs project by limiting spec files via config.testFiles as a JSON array of string glob patterns", ->
      cypress.start(["--run-project=#{@todosPath}", "--config=testFiles=[\"**/test2.coffee\",\"**/test1.js\"]"])
      .then =>
        expect(browsers.open).to.be.calledWithMatch(ELECTRON_BROWSER, {url: "http://localhost:8888/__/#/tests/integration/test2.coffee"})
      .then =>
        expect(browsers.open).to.be.calledWithMatch(ELECTRON_BROWSER, {url: "http://localhost:8888/__/#/tests/integration/test1.js"})
        @expectExitWith(0)

    it "does not watch settings or plugins in run mode", ->
      watch = sinon.spy(Watchers.prototype, "watch")
      watchTree = sinon.spy(Watchers.prototype, "watchTree")

      cypress.start(["--run-project=#{@pluginConfig}"])
      .then =>
        expect(watchTree).not.to.be.called
        expect(watch).not.to.be.called
        @expectExitWith(0)

    it "scaffolds out integration and example specs if they do not exist when not runMode", ->
      config.get(@pristinePath)
      .then (cfg) =>
        fs.statAsync(cfg.integrationFolder)
        .then ->
          throw new Error("integrationFolder should not exist!")
        .catch =>
          cypress.start(["--run-project=#{@pristinePath}", "--no-run-mode"])
        .then =>
          fs.statAsync(cfg.integrationFolder)
        .then =>
          Promise.join(
            fs.statAsync(path.join(cfg.integrationFolder, "examples", "actions.spec.js")),
            fs.statAsync(path.join(cfg.integrationFolder, "examples", "files.spec.js")),
            fs.statAsync(path.join(cfg.integrationFolder, "examples", "viewport.spec.js"))
          )

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
        @expectExitWithErr("CONFIG_FILE_NOT_FOUND", @pristinePath)

    it "does not scaffold integration or example specs when runMode", ->
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
          cypress.start(["--run-project=#{@pristinePath}", "--no-run-mode"])
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
          cypress.start(["--run-project=#{@pristinePath}", "--no-run-mode"])
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
        expect(browsers.open).to.be.calledWithMatch(ELECTRON_BROWSER, {
          proxyServer: "http://localhost:8888"
          show: true
        })
        @expectExitWith(0)

    it "turns on reporting", ->
      sinon.spy(Reporter, "create")

      cypress.start(["--run-project=#{@todosPath}"])
      .then  =>
        expect(Reporter.create).to.be.calledWith("spec")
        @expectExitWith(0)

    it "can change the reporter to nyan", ->
      sinon.spy(Reporter, "create")

      cypress.start(["--run-project=#{@todosPath}", "--reporter=nyan"])
      .then  =>
        expect(Reporter.create).to.be.calledWith("nyan")
        @expectExitWith(0)

    it "can change the reporter with cypress.json", ->
      sinon.spy(Reporter, "create")

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

    it "logs warning when removing old browser profiles fails", ->
      err = new Error('foo')

      sinon.stub(browsers, 'removeOldProfiles').rejects(err)

      cypress.start(["--run-project=#{@todosPath}"])
      .then =>
        expect(errors.warning).to.be.calledWith("CANNOT_REMOVE_OLD_BROWSER_PROFILES", err.stack)
        expect(console.log).to.be.calledWithMatch("Warning: We failed to remove old browser profiles from previous runs.")
        expect(console.log).to.be.calledWithMatch(err.message)

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

    it "logs error when supportFile doesn't exist", ->
      settings.write(@idsPath, {supportFile: "/does/not/exist"})
      .then =>
        cypress.start(["--run-project=#{@idsPath}"])
      .then =>
        @expectExitWithErr("SUPPORT_FILE_NOT_FOUND", "Your `supportFile` is set to `/does/not/exist`,")

    it "logs error when browser cannot be found", ->
      browsers.open.restore()

      cypress.start(["--run-project=#{@idsPath}", "--browser=foo"])
      .then =>
        @expectExitWithErr("BROWSER_NOT_FOUND_BY_NAME")

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
        @expectExitWithErr("NO_SPECS_FOUND", "path/to/spec")
        @expectExitWithErr("NO_SPECS_FOUND", "We searched for any files matching this glob pattern:")

    it "logs error and exits when spec absolute file was specified and does not exist", ->
      cypress.start([
        "--run-project=#{@todosPath}",
        "--spec=#{@todosPath}/tests/path/to/spec"
      ])
      .then =>
        @expectExitWithErr("NO_SPECS_FOUND", "tests/path/to/spec")

    it "logs error and exits when no specs were found at all", ->
      cypress.start([
        "--run-project=#{@todosPath}",
        "--config=integrationFolder=cypress/specs"
      ])
      .then =>
        @expectExitWithErr("NO_SPECS_FOUND", "We searched for any files inside of this folder:")
        @expectExitWithErr("NO_SPECS_FOUND", "cypress/specs")

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
        @expectExitWithErr("SETTINGS_VALIDATION_ERROR", "cypress.json")

    it "logs error and exits when project has invalid config values from the CLI", ->
      cypress.start([
        "--run-project=#{@todosPath}"
        "--config=baseUrl=localhost:9999"
      ])
      .then =>
        @expectExitWithErr("CONFIG_VALIDATION_ERROR", "localhost:9999")
        @expectExitWithErr("CONFIG_VALIDATION_ERROR", "We found an invalid configuration value")

    it "logs error and exits when project has invalid config values from env vars", ->
      process.env.CYPRESS_BASE_URL = "localhost:9999"

      cypress.start(["--run-project=#{@todosPath}"])
      .then =>
        @expectExitWithErr("CONFIG_VALIDATION_ERROR", "localhost:9999")
        @expectExitWithErr("CONFIG_VALIDATION_ERROR", "We found an invalid configuration value")

    it "logs error and exits when using an old configuration option: trashAssetsBeforeHeadlessRuns", ->
      cypress.start([
        "--run-project=#{@todosPath}"
        "--config=trashAssetsBeforeHeadlessRuns=false"
      ])
      .then =>
        @expectExitWithErr("RENAMED_CONFIG_OPTION", "trashAssetsBeforeHeadlessRuns")
        @expectExitWithErr("RENAMED_CONFIG_OPTION", "trashAssetsBeforeRuns")

    it "logs error and exits when using an old configuration option: videoRecording", ->
      cypress.start([
        "--run-project=#{@todosPath}"
        "--config=videoRecording=false"
      ])
      .then =>
        @expectExitWithErr("RENAMED_CONFIG_OPTION", "videoRecording")
        @expectExitWithErr("RENAMED_CONFIG_OPTION", "video")

    it "logs error and exits when using screenshotOnHeadlessFailure", ->
      cypress.start([
        "--run-project=#{@todosPath}"
        "--config=screenshotOnHeadlessFailure=false"
      ])
      .then =>
        @expectExitWithErr("SCREENSHOT_ON_HEADLESS_FAILURE_REMOVED", "screenshotOnHeadlessFailure")
        @expectExitWithErr("SCREENSHOT_ON_HEADLESS_FAILURE_REMOVED", "You now configure this behavior in your test code")

    ## TODO: make sure we have integration tests around this
    ## for headed projects!
    ## also make sure we test the rest of the integration functionality
    ## for headed errors! <-- not unit tests, but integration tests!
    it "logs error and exits when project folder has read permissions only and cannot write cypress.json", ->
      ## test disabled if running as root - root can write all things at all times
      if process.geteuid() == 0
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
      beforeEach ->
        appData.remove()
        .then =>
          formStatePath(@todosPath)
        .then (statePathStart) =>
          @statePath = appData.projectsPath(statePathStart)

      it "does not save project state", ->
        cypress.start(["--run-project=#{@todosPath}", "--spec=#{@todosPath}/tests/test2.coffee"])
        .then =>
          @expectExitWith(0)

          ## this should not save the project's state
          ## because its a noop in 'cypress run' mode
          openProject.getProject().saveState()
        .then =>
          fs.statAsync(@statePath)
          .then =>
            throw new Error("saved state should not exist but it did here: #{@statePath}")
          .catch {code: "ENOENT"}, ->

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
        plugins.init.restore()

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
        plugins.init.restore()
        browsers.open.restore()

        ee = new EE()
        ee.kill = ->
          # ughh, would be nice to test logic inside the launcher
          # that cleans up after the browser exit
          # like calling client.close() if available to let the
          # browser free any resources
          ee.emit("exit")
        ee.destroy = ->
          ee.emit("closed")
        ee.isDestroyed = -> false
        ee.loadURL = ->
        ee.focusOnWebView = ->
        ee.webContents = {
          debugger: {
            on: sinon.stub()
            attach: sinon.stub()
            sendCommand: sinon.stub().resolves()
          }
          setUserAgent: sinon.stub()
          session: {
            clearCache: sinon.stub().yieldsAsync()
            setProxy: sinon.stub().yieldsAsync()
            setUserAgent: sinon.stub()
          }
        }

        sinon.stub(browserUtils, "launch").resolves(ee)
        sinon.stub(Windows, "create").returns(ee)

      context "before:browser:launch", ->
        it "chrome", ->
          # during testing, do not try to connect to the remote interface or
          # use the Chrome remote interface client
          criClient = {
            ensureMinimumProtocolVersion: sinon.stub().resolves()
            close: sinon.stub().resolves()
          }
          sinon.stub(chromeBrowser, "_connectToChromeRemoteInterface").resolves(criClient)
          # the "returns(resolves)" stub is due to curried method
          # it accepts URL to visit and then waits for actual CRI client reference
          # and only then navigates to that URL
          sinon.stub(chromeBrowser, "_navigateUsingCRI").resolves()

          sinon.stub(chromeBrowser, "_setAutomation").returns()

          cypress.start([
            "--run-project=#{@pluginBrowser}"
            "--browser=chrome"
          ])
          .then =>
            args = browserUtils.launch.firstCall.args

            expect(args[0]).to.eq(_.find(TYPICAL_BROWSERS, { name: "chrome" }))

            browserArgs = args[2]

            expect(browserArgs).to.have.length(7)

            expect(browserArgs.slice(0, 4)).to.deep.eq([
              "chrome", "foo", "bar", "baz"
            ])

            @expectExitWith(0)

            expect(chromeBrowser._navigateUsingCRI).to.have.been.calledOnce
            expect(chromeBrowser._setAutomation).to.have.been.calledOnce
            expect(chromeBrowser._connectToChromeRemoteInterface).to.have.been.calledOnce

        it "electron", ->
          writeVideoFrame = sinon.stub()
          videoCapture.start.returns({ writeVideoFrame })

          cypress.start([
            "--run-project=#{@pluginBrowser}"
            "--browser=electron"
          ])
          .then =>
            expect(Windows.create).to.be.calledWithMatch(@pluginBrowser, {
              browser: "electron"
              foo: "bar"
              onNewWindow: sinon.match.func
              onPaint: sinon.match.func
            })

            @expectExitWith(0)

    describe "--port", ->
      beforeEach ->
        runMode.listenForProjectEnd.resolves({stats: {failures: 0} })

      it "can change the default port to 5555", ->
        listen = sinon.spy(http.Server.prototype, "listen")
        open   = sinon.spy(Server.prototype, "open")

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

        server.listenAsync(5555, "127.0.0.1")
        .then =>
          cypress.start(["--run-project=#{@todosPath}", "--port=5555"])
        .then =>
          @expectExitWithErr("PORT_IN_USE_LONG", "5555")

    describe "--env", ->
      beforeEach ->
        process.env = _.omit(process.env, "CYPRESS_DEBUG")

        runMode.listenForProjectEnd.resolves({stats: {failures: 0} })

      it "can set specific environment variables", ->
        cypress.start([
          "--run-project=#{@todosPath}",
          "--video=false"
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

      it "parses environment variables with empty values", ->
        cypress.start([
          "--run-project=#{@todosPath}",
          "--video=false"
          "--env=FOO=,BAR=,BAZ=ipsum"
        ])
        .then =>
          expect(openProject.getProject().cfg.env).to.deep.eq({
            FOO: ''
            BAR: ''
            BAZ: 'ipsum'
          })

          @expectExitWith(0)

    describe "--config-file", ->
      it "false does not require cypress.json to run", ->
        fs.statAsync(path.join(@pristinePath, 'cypress.json'))
          .then =>
            throw new Error("cypress.json should not exist")
          .catch {code: "ENOENT"}, =>
            cypress.start([
              "--run-project=#{@pristinePath}"
              "--no-run-mode",
              "--config-file",
              "false"
            ]).then =>
              @expectExitWith(0)

      it "with a custom config file fails when it doesn't exist", ->
        @filename = "abcdefgh.test.json"

        fs.statAsync(path.join(@todosPath, @filename))
          .then =>
            throw new Error("#{@filename} should not exist")
          .catch {code: "ENOENT"}, =>
            cypress.start([
              "--run-project=#{@todosPath}"
              "--no-run-mode",
              "--config-file",
              @filename
            ]).then =>
              @expectExitWithErr("CONFIG_FILE_NOT_FOUND", @filename, @todosPath)

  ## most record mode logic is covered in e2e tests.
  ## we only need to cover the edge cases / warnings
  context "--record or --ci", ->
    beforeEach ->
      sinon.stub(api, "createRun").resolves()
      sinon.stub(electron.app, "on").withArgs("ready").yieldsAsync()
      sinon.stub(browsers, "open")
      sinon.stub(runMode, "waitForSocketConnection")
      sinon.stub(runMode, "waitForTestsToFinishRunning").resolves({
        stats: {
          tests: 1
          passes: 2
          failures: 3
          pending: 4
          skipped: 5
          wallClockDuration: 6
        }
        tests: []
        hooks: []
        video: "path/to/video"
        shouldUploadVideo: true
        screenshots: []
        config: {}
        spec: {}
      })

      Promise.all([
        ## make sure we have no user object
        user.set({})

        Project.id(@todosPath)
        .then (id) =>
          @projectId = id
      ])

    it "uses process.env.CYPRESS_PROJECT_ID", ->
      sinon.stub(env, "get").withArgs("CYPRESS_PROJECT_ID").returns(@projectId)

      cypress.start([
        "--cwd=/foo/bar"
        "--run-project=#{@noScaffolding}",
        "--record",
        "--key=token-123",
      ])
      .then =>
        expect(api.createRun).to.be.calledWithMatch({projectId: @projectId})
        expect(errors.warning).not.to.be.called
        @expectExitWith(3)

    it "uses process.env.CYPRESS_RECORD_KEY", ->
      sinon.stub(env, "get")
      .withArgs("CYPRESS_PROJECT_ID").returns("foo-project-123")
      .withArgs("CYPRESS_RECORD_KEY").returns("token")

      cypress.start([
        "--cwd=/foo/bar"
        "--run-project=#{@noScaffolding}",
        "--record",
      ])
      .then =>
        expect(api.createRun).to.be.calledWithMatch({
          projectId: "foo-project-123"
          recordKey: "token"
        })
        expect(errors.warning).not.to.be.called
        @expectExitWith(3)

    it "logs warning when using deprecated --ci arg and no env var", ->
      cypress.start([
        "--run-project=#{@recordPath}",
        "--key=token-123",
        "--ci"
      ])
      .then =>
        expect(errors.warning).to.be.calledWith("CYPRESS_CI_DEPRECATED")
        expect(console.log).to.be.calledWithMatch("You are using the deprecated command:")
        expect(console.log).to.be.calledWithMatch("cypress run --record --key <record_key>")
        expect(errors.warning).not.to.be.calledWith("PROJECT_ID_AND_KEY_BUT_MISSING_RECORD_OPTION")
        @expectExitWith(3)

    it "logs warning when using deprecated --ci arg and env var", ->
      sinon.stub(env, "get")
      .withArgs("CYPRESS_CI_KEY")
      .returns("asdf123foobarbaz")

      cypress.start([
        "--run-project=#{@recordPath}",
        "--key=token-123",
        "--ci"
      ])
      .then =>
        expect(errors.warning).to.be.calledWith("CYPRESS_CI_DEPRECATED_ENV_VAR")
        expect(console.log).to.be.calledWithMatch("You are using the deprecated command:")
        expect(console.log).to.be.calledWithMatch("cypress ci")
        expect(console.log).to.be.calledWithMatch("cypress run --record")
        @expectExitWith(3)

    it "errors and exits when using --group but ciBuildId could not be generated", ->
      sinon.stub(ciProvider, "provider").returns(null)

      cypress.start([
        "--run-project=#{@recordPath}",
        "--record"
        "--key=token-123",
        "--group=e2e-tests",
      ])
      .then =>
        @expectExitWithErr("INDETERMINATE_CI_BUILD_ID")
        snapshotConsoleLogs("INDETERMINATE_CI_BUILD_ID-group 1")

    it "errors and exits when using --parallel but ciBuildId could not be generated", ->
      sinon.stub(ciProvider, "provider").returns(null)

      cypress.start([
        "--run-project=#{@recordPath}",
        "--record"
        "--key=token-123",
        "--parallel",
      ])
      .then =>
        @expectExitWithErr("INDETERMINATE_CI_BUILD_ID")
        snapshotConsoleLogs("INDETERMINATE_CI_BUILD_ID-parallel 1")

    it "errors and exits when using --parallel and --group but ciBuildId could not be generated", ->
      sinon.stub(ciProvider, "provider").returns(null)

      cypress.start([
        "--run-project=#{@recordPath}",
        "--record"
        "--key=token-123",
        "--group=e2e-tests-chrome",
        "--parallel",
      ])
      .then =>
        @expectExitWithErr("INDETERMINATE_CI_BUILD_ID")
        snapshotConsoleLogs("INDETERMINATE_CI_BUILD_ID-parallel-group 1")

    it "errors and exits when using --ci-build-id with no group or parallelization", ->
      cypress.start([
        "--run-project=#{@recordPath}",
        "--record"
        "--key=token-123",
        "--ci-build-id=ciBuildId123",
      ])
      .then =>
        @expectExitWithErr("INCORRECT_CI_BUILD_ID_USAGE")
        snapshotConsoleLogs("INCORRECT_CI_BUILD_ID_USAGE 1")

    it "errors and exits when using --ci-build-id without recording", ->
      cypress.start([
        "--run-project=#{@recordPath}",
        "--ci-build-id=ciBuildId123",
      ])
      .then =>
        @expectExitWithErr("RECORD_PARAMS_WITHOUT_RECORDING")
        snapshotConsoleLogs("RECORD_PARAMS_WITHOUT_RECORDING-ciBuildId 1")

    it "errors and exits when using --group without recording", ->
      cypress.start([
        "--run-project=#{@recordPath}",
        "--group=e2e-tests",
      ])
      .then =>
        @expectExitWithErr("RECORD_PARAMS_WITHOUT_RECORDING")
        snapshotConsoleLogs("RECORD_PARAMS_WITHOUT_RECORDING-group 1")

    it "errors and exits when using --parallel without recording", ->
      cypress.start([
        "--run-project=#{@recordPath}",
        "--parallel",
      ])
      .then =>
        @expectExitWithErr("RECORD_PARAMS_WITHOUT_RECORDING")
        snapshotConsoleLogs("RECORD_PARAMS_WITHOUT_RECORDING-parallel 1")

    it "errors and exits when using --group and --parallel without recording", ->
      cypress.start([
        "--run-project=#{@recordPath}",
        "--group=electron-smoke-tests",
        "--parallel",
      ])
      .then =>
        @expectExitWithErr("RECORD_PARAMS_WITHOUT_RECORDING")
        snapshotConsoleLogs("RECORD_PARAMS_WITHOUT_RECORDING-group-parallel 1")

    it "errors and exits when group name is not unique and explicitly passed ciBuildId", ->
      err = new Error()
      err.statusCode = 422
      err.error = {
        code: "RUN_GROUP_NAME_NOT_UNIQUE"
        payload: {
          runUrl: "https://dashboard.cypress.io/runs/12345"
        }
      }

      api.createRun.rejects(err)

      cypress.start([
        "--run-project=#{@recordPath}",
        "--record"
        "--key=token-123",
        "--group=electron-smoke-tests",
        "--ciBuildId=ciBuildId123",
      ])
      .then =>
        @expectExitWithErr("DASHBOARD_RUN_GROUP_NAME_NOT_UNIQUE")
        snapshotConsoleLogs("DASHBOARD_RUN_GROUP_NAME_NOT_UNIQUE 1")

    it "errors and exits when parallel group params are different", ->
      sinon.stub(system, "info").returns({
        osName: "darwin"
        osVersion: "v1"
      })

      sinon.stub(browsers, "ensureAndGetByNameOrPath").returns({
        version: "59.1.2.3"
        displayName: "Electron"
      })

      err = new Error()
      err.statusCode = 422
      err.error = {
        code: "PARALLEL_GROUP_PARAMS_MISMATCH"
        payload: {
          runUrl: "https://dashboard.cypress.io/runs/12345"
        }
      }

      api.createRun.rejects(err)

      cypress.start([
        "--run-project=#{@recordPath}",
        "--record"
        "--key=token-123",
        "--parallel"
        "--group=electron-smoke-tests",
        "--ciBuildId=ciBuildId123",
      ])
      .then =>
        @expectExitWithErr("DASHBOARD_PARALLEL_GROUP_PARAMS_MISMATCH")
        snapshotConsoleLogs("DASHBOARD_PARALLEL_GROUP_PARAMS_MISMATCH 1")

    it "errors and exits when parallel is not allowed", ->
      err = new Error()
      err.statusCode = 422
      err.error = {
        code: "PARALLEL_DISALLOWED"
        payload: {
          runUrl: "https://dashboard.cypress.io/runs/12345"
        }
      }

      api.createRun.rejects(err)

      cypress.start([
        "--run-project=#{@recordPath}",
        "--record"
        "--key=token-123",
        "--parallel"
        "--group=electron-smoke-tests",
        "--ciBuildId=ciBuildId123",
      ])
      .then =>
        @expectExitWithErr("DASHBOARD_PARALLEL_DISALLOWED")
        snapshotConsoleLogs("DASHBOARD_PARALLEL_DISALLOWED 1")

    it "errors and exits when parallel is required", ->
      err = new Error()
      err.statusCode = 422
      err.error = {
        code: "PARALLEL_REQUIRED"
        payload: {
          runUrl: "https://dashboard.cypress.io/runs/12345"
        }
      }

      api.createRun.rejects(err)

      cypress.start([
        "--run-project=#{@recordPath}",
        "--record"
        "--key=token-123",
        "--parallel"
        "--group=electron-smoke-tests",
        "--ciBuildId=ciBuildId123",
      ])
      .then =>
        @expectExitWithErr("DASHBOARD_PARALLEL_REQUIRED")
        snapshotConsoleLogs("DASHBOARD_PARALLEL_REQUIRED 1")

    it "errors and exits when run is already complete", ->
      err = new Error()
      err.statusCode = 422
      err.error = {
        code: "ALREADY_COMPLETE"
        payload: {
          runUrl: "https://dashboard.cypress.io/runs/12345"
        }
      }

      api.createRun.rejects(err)

      cypress.start([
        "--run-project=#{@recordPath}",
        "--record"
        "--key=token-123",
        "--group=electron-smoke-tests",
        "--ciBuildId=ciBuildId123",
      ])
      .then =>
        @expectExitWithErr("DASHBOARD_ALREADY_COMPLETE")
        snapshotConsoleLogs("DASHBOARD_ALREADY_COMPLETE 1")

    it "errors and exits when run is stale", ->
      err = new Error()
      err.statusCode = 422
      err.error = {
        code: "STALE_RUN"
        payload: {
          runUrl: "https://dashboard.cypress.io/runs/12345"
        }
      }

      api.createRun.rejects(err)

      cypress.start([
        "--run-project=#{@recordPath}",
        "--record"
        "--key=token-123",
        "--parallel"
        "--group=electron-smoke-tests",
        "--ciBuildId=ciBuildId123",
      ])
      .then =>
        @expectExitWithErr("DASHBOARD_STALE_RUN")
        snapshotConsoleLogs("DASHBOARD_STALE_RUN 1")

  context "--return-pkg", ->
    beforeEach ->
      console.log.restore()
      sinon.stub(console, "log")

    it "logs package.json and exits", ->
      cypress.start(["--return-pkg"])
      .then =>
        expect(console.log).to.be.calledWithMatch('{"name":"cypress"')
        @expectExitWith(0)

  context "--version", ->
    beforeEach ->
      console.log.restore()
      sinon.stub(console, "log")

    it "logs version and exits", ->
      cypress.start(["--version"])
      .then =>
        expect(console.log).to.be.calledWith(pkg.version)
        @expectExitWith(0)

  context "--smoke-test", ->
    beforeEach ->
      console.log.restore()
      sinon.stub(console, "log")

    it "logs pong value and exits", ->
      cypress.start(["--smoke-test", "--ping=abc123"])
      .then =>
        expect(console.log).to.be.calledWith("abc123")
        @expectExitWith(0)

  context "interactive", ->
    beforeEach ->
      @win = {
        on: sinon.stub()
        webContents: {
          on: sinon.stub()
        }
      }

      sinon.stub(electron.app, "on").withArgs("ready").yieldsAsync()
      sinon.stub(Windows, "open").resolves(@win)
      sinon.stub(Server.prototype, "startWebsockets")
      sinon.spy(Events, "start")
      sinon.stub(electron.ipcMain, "on")

    it "passes options to interactiveMode.ready", ->
      sinon.stub(interactiveMode, "ready")

      cypress.start(["--updating", "--port=2121", "--config=pageLoadTimeout=1000"])
      .then ->
        expect(interactiveMode.ready).to.be.calledWithMatch({
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
          config: {
            pageLoadTimeout: 1000
            port: 2121
          }
        })

    it "passes filtered options to Project#open and sets cli config", ->
      getConfig = sinon.spy(Project.prototype, "getConfig")
      open      = sinon.stub(Server.prototype, "open").resolves([])

      process.env.CYPRESS_FILE_SERVER_FOLDER = "foo"
      process.env.CYPRESS_BASE_URL = "http://localhost"
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
        cypress.start([
          "--port=2121",
          "--config",
          "pageLoadTimeout=1000",
          "--foo=bar",
          "--env=baz=baz"
        ])
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

        expect(open).to.be.called

        cfg = open.getCall(0).args[0]

        expect(cfg.fileServerFolder).to.eq(path.join(@todosPath, "foo"))
        expect(cfg.pageLoadTimeout).to.eq(1000)
        expect(cfg.port).to.eq(2121)
        expect(cfg.baseUrl).to.eq("http://localhost")
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
          value: "http://localhost"
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
      event = { sender: { send: sinon.stub() } }
      warning = { message: "Blah blah baseUrl blah blah" }
      open = sinon.stub(Server.prototype, "open").resolves([2121, warning])

      cypress.start(["--port=2121", "--config", "pageLoadTimeout=1000", "--foo=bar", "--env=baz=baz"])
      .then =>
        options = Events.start.firstCall.args[0]
        Events.handleEvent(options, bus, event, 123, "on:project:warning")
        Events.handleEvent(options, bus, event, 123, "open:project", @todosPath)
      .then ->
        expect(event.sender.send.withArgs("response").firstCall.args[1].data).to.eql(warning)

    describe "--config-file", ->
      beforeEach ->
        @filename = "foo.bar.baz.asdf.quux.json"
        @open = sinon.stub(Server.prototype, "open").resolves([])

      it "reads config from a custom config file", ->
        sinon.stub(fs, "readJsonAsync")
        fs.readJsonAsync.withArgs(path.join(@pristinePath, @filename)).resolves({
          env: { foo: "bar" },
          port: 2020
        })
        fs.readJsonAsync.callThrough()

        cypress.start([
          "--config-file=#{@filename}"
        ])
        .then =>
          options = Events.start.firstCall.args[0]
          Events.handleEvent(options, {}, {}, 123, "open:project", @pristinePath)
        .then =>
          expect(@open).to.be.called

          cfg = @open.getCall(0).args[0]

          expect(cfg.env.foo).to.equal("bar")
          expect(cfg.port).to.equal(2020)

      it "creates custom config file if it does not exist", ->
        write = sinon.spy(settings, "_write")

        cypress.start([
          "--config-file=#{@filename}"
        ])
        .then =>
          options = Events.start.firstCall.args[0]
          Events.handleEvent(options, {}, {}, 123, "open:project", @pristinePath)
        .then =>
          expect(@open).to.be.called

          fs.readJsonAsync(path.join(@pristinePath, @filename))
          .then (json) =>
            expect(json).to.deep.equal({})

  context "--cwd", ->
    beforeEach ->
      errors.warning.restore()
      sinon.stub(electron.app, "on").withArgs("ready").yieldsAsync()
      sinon.stub(interactiveMode, "ready").resolves()
      sinon.spy(errors, "warning")

    it "shows warning if Cypress has been started directly", ->
      cypress.start().then ->
        expect(errors.warning).to.be.calledWith("INVOKED_BINARY_OUTSIDE_NPM_MODULE")
        expect(console.log).to.be.calledWithMatch("It looks like you are running the Cypress binary directly.")
        expect(console.log).to.be.calledWithMatch("https://on.cypress.io/installing-cypress")

    it "does not show warning if finds --cwd", ->
      cypress.start(["--cwd=/foo/bar"]).then ->
        expect(errors.warning).not.to.be.called

  context "no args", ->
    beforeEach ->
      sinon.stub(electron.app, "on").withArgs("ready").yieldsAsync()
      sinon.stub(interactiveMode, "ready").resolves()

    it "runs interactiveMode and does not exit", ->
      cypress.start().then ->
        expect(interactiveMode.ready).to.be.calledOnce
