require("../spec_helper")

os       = require("os")
path     = require("path")
http     = require("http")
Promise  = require("bluebird")
electron = require("electron")
inquirer = require("inquirer")
Fixtures = require("../helpers/fixtures")
pkg      = require("#{root}package.json")
settings = require("#{root}lib/util/settings")
Tray     = require("#{root}lib/electron/handlers/tray")
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
        user.set({name: "brian", session_token: "session-123"}),

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

        cypress.start(["--get-key", "--project=#{@todosPath}"]).then =>
          expect(console.log).to.be.calledWith("new-key-123")
          @expectExitWith(0)

    it "logs error and exits when user isn't logged in", ->
      user.set({})
      .then =>
        cypress.start(["--get-key", "--project=#{@todosPath}"]).then =>
          @expectExitWithErr("NOT_LOGGED_IN")

    it "logs error and exits when project does not have an id", ->
      user.set({session_token: "session-123"})
      .then =>
        cypress.start(["--get-key", "--project=#{@pristinePath}"]).then =>
          @expectExitWithErr("NO_PROJECT_ID", @pristinePath)

    it "logs error and exits when project could not be found at the path", ->
      user.set({session_token: "session-123"})
      .then =>
        cypress.start(["--get-key", "--project=path/to/no/project"]).then =>
          @expectExitWithErr("NO_PROJECT_FOUND_AT_PROJECT_ROOT", "path/to/no/project")

    it "logs error and exits when project token cannot be fetched", ->
      Promise.all([
        user.set({session_token: "session-123"}),

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

        cypress.start(["--get-key", "--project=#{@todosPath}"]).then =>
          @expectExitWithErr("CANNOT_FETCH_PROJECT_TOKEN")

  context "--new-key", ->
    it "writes out key and exits on success", ->
      Promise.all([
        user.set({name: "brian", session_token: "session-123"}),

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

        cypress.start(["--new-key", "--project=#{@todosPath}"]).then =>
          expect(console.log).to.be.calledWith("new-key-123")
          @expectExitWith(0)

    it "logs error and exits when user isn't logged in", ->
      user.set({})
      .then =>
        cypress.start(["--new-key", "--project=#{@todosPath}"]).then =>
          @expectExitWithErr("NOT_LOGGED_IN")

    it "logs error and exits when project does not have an id", ->
      user.set({session_token: "session-123"})
      .then =>
        cypress.start(["--new-key", "--project=#{@pristinePath}"]).then =>
          @expectExitWithErr("NO_PROJECT_ID", @pristinePath)

    it "logs error and exits when project could not be found at the path", ->
      user.set({session_token: "session-123"})
      .then =>
        cypress.start(["--new-key", "--project=path/to/no/project"]).then =>
          @expectExitWithErr("NO_PROJECT_FOUND_AT_PROJECT_ROOT", "path/to/no/project")

    it "logs error and exits when project token cannot be fetched", ->
      Promise.all([
        user.set({session_token: "session-123"}),

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

        cypress.start(["--new-key", "--project=#{@todosPath}"]).then =>
          @expectExitWithErr("CANNOT_CREATE_PROJECT_TOKEN")

  context "--run-project", ->
    beforeEach ->
      @sandbox.stub(electron.app, "on").withArgs("ready").yieldsAsync()
      @sandbox.stub(headless, "waitForRendererToConnect")
      @sandbox.stub(headless, "createRenderer")
      @sandbox.stub(headless, "waitForTestsToFinishRunning").resolves({failures: 10})
      @sandbox.spy(api, "updateProject")

    it "runs project headlessly and exits with status 0", ->
      Promise.all([
        user.set({name: "brian", session_token: "session-123"}),

        Project.add(@todosPath)
      ])
      .then =>
        cypress.start(["--run-project=#{@todosPath}"]).then =>
          expect(api.updateProject).not.to.be.called
          expect(headless.createRenderer).to.be.calledWith("http://localhost:8888/__/#/tests/__all?__ui=satellite")
          @expectExitWith(0)

    it "generates a project id if missing one", ->
      @sandbox.stub(api, "createProject").withArgs("pristine", "session-123").resolves("pristine-id-123")

      Promise.all([
        user.set({name: "brian", session_token: "session-123"}),

        Project.add(@pristinePath)
      ])
      .then =>
        cypress.start(["--run-project=#{@pristinePath}"]).then =>
          @expectExitWith(0)

          ## give it time to request the project id
          Promise.delay(100).then =>
            Project(@pristinePath).getProjectId().then (id) ->
              expect(id).to.eq("pristine-id-123")

    it "does not error when getting a creating a project id fails", ->
      @sandbox.stub(api, "createProject").withArgs("pristine", "session-123").rejects(new Error)

      Promise.all([
        user.set({name: "brian", session_token: "session-123"}),

        Project.add(@pristinePath)
      ])
      .then =>
        cypress.start(["--run-project=#{@pristinePath}"]).then =>
          Promise.delay(100).then =>
            @expectExitWith(0)

    it "prompts to add the project and then immediately runs the tests and exits with 0", ->
      @sandbox.stub(inquirer, "prompt").yieldsAsync({add: true})

      user.set({session_token: "session-123"})
      .then =>
        cypress.start(["--run-project=#{@todosPath}"]).then =>
          expect(inquirer.prompt).to.be.calledOnce
          @expectExitWith(0)

    it "runs project by specific spec and exits with status 0", ->
      Promise.all([
        user.set({session_token: "session-123"}),

        Project.add(@todosPath)
      ])
      .then =>
        cypress.start(["--run-project=#{@todosPath}", "--spec=test2.coffee"]).then =>
          expect(headless.createRenderer).to.be.calledWith("http://localhost:8888/__/#/tests/test2.coffee?__ui=satellite")
          @expectExitWith(0)

    it "runs project by specific absolute spec and exits with status 0", ->
      Promise.all([
        user.set({session_token: "session-123"}),

        Project.add(@todosPath)
      ])
      .then =>
        cypress.start(["--run-project=#{@todosPath}", "--spec=#{@todosPath}/tests/test2.coffee"]).then =>
          expect(headless.createRenderer).to.be.calledWith("http://localhost:8888/__/#/tests/test2.coffee?__ui=satellite")
          @expectExitWith(0)

    it "scaffolds out integration and example_spec if they do not exist", ->
      Promise.all([
        user.set({session_token: "session-123"}),

        config.get(@pristinePath).then (@cfg) =>

        Project.add(@pristinePath)
      ])
      .then =>
        fs.statAsync(@cfg.integrationFolder)
        .then ->
          throw new Error("integrationolder should not exist!")
        .catch =>
          cypress.start(["--run-project=#{@pristinePath}"])
        .then =>
          fs.statAsync(@cfg.integrationFolder)
        .then =>
          fs.statAsync path.join(@cfg.integrationFolder, "example_spec.js")

    it "scaffolds out fixtures + files if they do not exist", ->
      Promise.all([
        user.set({session_token: "session-123"}),

        config.get(@pristinePath).then (@cfg) =>

        Project.add(@pristinePath)
      ])
      .then =>
        fs.statAsync(@cfg.fixturesFolder)
        .then ->
          throw new Error("fixturesFolder should not exist!")
        .catch =>
          cypress.start(["--run-project=#{@pristinePath}"])
        .then =>
          fs.statAsync(@cfg.fixturesFolder)
        .then =>
          fs.statAsync path.join(@cfg.fixturesFolder, "example.json")

    it "scaffolds out support + files if they do not exist", ->
      Promise.all([
        user.set({session_token: "session-123"}),

        config.get(@pristinePath).then (@cfg) =>

        Project.add(@pristinePath)
      ])
      .then =>
        fs.statAsync(@cfg.supportFolder)
        .then ->
          throw new Error("supportFolder should not exist!")
        .catch =>
          cypress.start(["--run-project=#{@pristinePath}"])
        .then =>
          fs.statAsync(@cfg.supportFolder)
        .then =>
          fs.statAsync path.join(@cfg.supportFolder, "commands.js")
        .then =>
          fs.statAsync path.join(@cfg.supportFolder, "defaults.js")

    it "removes fixtures when they exist and fixturesFolder is false", (done) ->
      Promise.all([
        user.set({session_token: "session-123"}),

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

    it "removes support when they exist and supportFolder is false", (done) ->
      Promise.all([
        user.set({session_token: "session-123"}),

        config.get(@idsPath).then (@cfg) =>

        Project.add(@idsPath)
      ])
      .then =>
        fs.statAsync(@cfg.supportFolder)
      .then =>
        settings.read(@idsPath)
      .then (json) =>
        json.supportFolder = false
        settings.write(@idsPath, json)
      .then =>
        cypress.start(["--run-project=#{@idsPath}"])
      .then =>
        fs.statAsync(@cfg.supportFolder)
        .then ->
          throw new Error("fixturesFolder should not exist!")
        .catch -> done()

    it "runs project headlessly and displays gui", ->
      Promise.all([
        user.set({name: "brian", session_token: "session-123"}),

        Project.add(@todosPath)
      ])
      .then =>
        cypress.start(["--run-project=#{@todosPath}", "--show-headless-gui"]).then =>
          expect(headless.createRenderer).to.be.calledWith("http://localhost:8888/__/#/tests/__all?__ui=satellite", true)
          @expectExitWith(0)

    it "turns on reporting", ->
      @sandbox.spy(Reporter, "create")

      Promise.all([
        user.set({name: "brian", session_token: "session-123"}),

        Project.add(@todosPath)
      ])
      .then =>
        cypress.start(["--run-project=#{@todosPath}"]).then  =>
          expect(Reporter.create).to.be.calledWith("spec")
          @expectExitWith(0)

    it "can change the reporter to nyan", ->
      @sandbox.spy(Reporter, "create")

      Promise.all([
        user.set({name: "brian", session_token: "session-123"}),

        Project.add(@todosPath)
      ])
      .then =>
        cypress.start(["--run-project=#{@todosPath}", "--reporter=nyan"]).then  =>
          expect(Reporter.create).to.be.calledWith("nyan")
          @expectExitWith(0)

    it "can change the reporter with cypress.json", ->
      @sandbox.spy(Reporter, "create")

      Promise.all([
        user.set({session_token: "session-123"}),

        config.get(@idsPath).then (@cfg) =>

        Project.add(@idsPath)
      ])
      .then =>
        settings.read(@idsPath)
      .then (json) =>
        json.reporter = "dot"
        settings.write(@idsPath, json)
      .then =>
        cypress.start(["--run-project=#{@idsPath}"]).then  =>
      .then =>
        expect(Reporter.create).to.be.calledWith("dot")
        @expectExitWith(0)

    it "logs error and exits when user isn't logged in", ->
      user.set({})
      .then =>
        cypress.start(["--run-project=#{@todosPath}"]).then =>
          @expectExitWithErr("NOT_LOGGED_IN")

    it "logs error and exits when project could not be found at the path and was not chosen to be added to Cypress", ->
      @sandbox.stub(inquirer, "prompt").yieldsAsync({add: false})

      user.set({session_token: "session-123"})
      .then =>
        cypress.start(["--run-project=does/not/exist"]).then =>
          @expectExitWithErr("PROJECT_DOES_NOT_EXIST")

    it "logs error and exits when spec file was specified and does not exist", ->
      Promise.all([
        user.set({session_token: "session-123"}),

        Project.add(@todosPath)
      ])
      .then =>
        cypress.start(["--run-project=#{@todosPath}", "--spec=path/to/spec"]).then =>
          @expectExitWithErr("SPEC_FILE_NOT_FOUND", "#{@todosPath}/tests/path/to/spec")

    it "logs error and exits when spec absolute file was specified and does not exist", ->
      Promise.all([
        user.set({session_token: "session-123"}),

        Project.add(@todosPath)
      ])
      .then =>
        cypress.start(["--run-project=#{@todosPath}", "--spec=#{@todosPath}/tests/path/to/spec"]).then =>
          @expectExitWithErr("SPEC_FILE_NOT_FOUND", "#{@todosPath}/tests/path/to/spec")

    it "logs error and exits when project has cypress.json syntax error", ->
      Promise.all([
        user.set({name: "brian", session_token: "session-123"}),

        Project.add(@todosPath)
      ])
      .then =>
        fs.writeFileAsync(@todosPath + "/cypress.json", "{'foo': 'bar}")
      .then =>
        cypress.start(["--run-project=#{@todosPath}"]).then =>
          @expectExitWithErr("ERROR_READING_FILE", @todosPath)

    it "logs error and exits when project has cypress.env.json syntax error", ->
      Promise.all([
        user.set({name: "brian", session_token: "session-123"}),

        Project.add(@todosPath)
      ])
      .then =>
        fs.writeFileAsync(@todosPath + "/cypress.env.json", "{'foo': 'bar}")
      .then =>
        cypress.start(["--run-project=#{@todosPath}"]).then =>
          @expectExitWithErr("ERROR_READING_FILE", @todosPath)

    ## TODO: make sure we have integration tests around this
    ## for headed projects!
    ## also make sure we test the rest of the integration functionality
    ## for headed errors! <-- not unit tests, but integration tests!
    it "logs error and exits when project folder has read permissions only and cannot write cypress.json", ->
      permissionsPath = path.resolve("./permissions")

      @sandbox.stub(inquirer, "prompt").yieldsAsync({add: true})

      user.set({session_token: "session-123"})
      .then =>
        fs.ensureDirAsync(permissionsPath)
      .then =>
        fs.chmodAsync(permissionsPath, "111")
      .then =>
        cypress.start(["--run-project=#{permissionsPath}"]).then =>
          fs.chmodAsync(permissionsPath, "644").then =>
            fs.removeAsync(permissionsPath).then =>
              @expectExitWithErr("ERROR_WRITING_FILE", permissionsPath)

    describe "morgan", ->
      it "sets morgan to false", ->
        Promise.all([
          user.set({name: "brian", session_token: "session-123"}),

          Project.add(@todosPath)
        ])
        .then =>
          cypress.start(["--run-project=#{@todosPath}"]).then =>
            expect(project.opened().cfg.morgan).to.be.false
            @expectExitWith(0)

    describe "config overrides", ->
      it "can override default values", ->
        Promise.all([
          user.set({name: "brian", session_token: "session-123"}),

          Project.add(@todosPath)
        ])
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
        headless.waitForTestsToFinishRunning.resolves({})

        Promise.all([
          user.set({name: "brian", session_token: "session-123"}),

          Project.add(@todosPath)
        ])

      it "can change the default port to 5555", ->
        listen = @sandbox.spy(http.Server.prototype, "listen")
        open   = @sandbox.spy(Server.prototype, "open")

        cypress.start(["--run-project=#{@todosPath}", "--port=5555"]).then =>
          expect(project.opened().cfg.port).to.eq(5555)
          expect(listen).to.be.calledWith(5555)
          expect(open).to.be.calledWithMatch(@todosPath, {port: 5555})
          @expectExitWith(0)

      ## TODO: handle PORT_IN_USE short integration test
      it "logs error and exits when port is in use", ->
        server = http.createServer()
        server = Promise.promisifyAll(server)
        server.listenAsync(5555)
        .then =>
          cypress.start(["--run-project=#{@todosPath}", "--port=5555"]).then =>
            @expectExitWithErr("PORT_IN_USE_LONG", "5555")

    describe "--env", ->
      beforeEach ->
        headless.waitForTestsToFinishRunning.resolves({})

        Promise.all([
          user.set({name: "brian", session_token: "session-123"}),

          Project.add(@todosPath)
        ])

      it "can set specific environment variables", ->
        cypress.start([
          "--run-project=#{@todosPath}",
          "--env",
          "version=0.12.1,foo=bar,host=http://localhost:8888"
        ]).then =>
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
      @sandbox.stub(os, "platform").returns("linux")
      @sandbox.stub(electron.app, "on").withArgs("ready").yieldsAsync()
      @sandbox.stub(ci, "getBranch").resolves("bem/ci")
      @sandbox.stub(ci, "getAuthor").resolves("brian")
      @sandbox.stub(ci, "getMessage").resolves("foo")
      @sandbox.stub(headless, "runTests").resolves({
        connection: null
        renderer: null
        stats: {failures: 10}
      })

      Promise.all([
        ## make sure we have no user object
        user.set({})
        .then =>
          Project.id(@todosPath)
        .then (id) =>
          @projectId = id
      ])
      .then =>
        @createCi = @sandbox.stub(api, "createCi").withArgs({
          key: "secret-key-123"
          projectId: @projectId
          branch: "bem/ci"
          author: "brian"
          message: "foo"
        })

    it "runs project in ci and exits with number of failures", ->
      @createCi.resolves("ci_guid-123")

      @updateCi = @sandbox.stub(api, "updateCi").withArgs({
        key: "secret-key-123"
        ciId: "ci_guid-123"
        projectId: @projectId
        stats: {failures: 10}
      }).resolves()

      cypress.start(["--run-project=#{@todosPath}", "--key=secret-key-123", "--ci"]).then =>
        expect(@updateCi).to.be.calledOnce
        @expectExitWith(10)

    it "uses process.env.CYPRESS_PROJECT_ID", ->
      ## set the projectId to be todos even though
      ## we are running the prisine project
      process.env.CYPRESS_PROJECT_ID = @projectId

      @createCi.resolves()
      @sandbox.stub(api, "updateCi").resolves()

      cypress.start(["--run-project=#{@pristinePath}", "--key=secret-key-123", "--ci"]).then =>
        @expectExitWith(10)

    it "logs error when missing project id", ->
      cypress.start(["--run-project=#{@pristinePath}", "--key=secret-key-123", "--ci"]).then =>
        @expectExitWithErr("NO_PROJECT_ID", @pristinePath)

    it "logs error and exits when ci key is not valid", ->
      err = new Error
      err.statusCode = 401
      @createCi.rejects(err)

      cypress.start(["--run-project=#{@todosPath}", "--key=secret-key-123", "--ci"]).then =>
        @expectExitWithErr("CI_KEY_NOT_VALID", "secre...y-123")

    it "logs error and exits when project could not be found", ->
      err = new Error
      err.statusCode = 404
      @createCi.rejects(err)

      cypress.start(["--run-project=#{@todosPath}", "--key=secret-key-123", "--ci"]).then =>
        @expectExitWithErr("CI_PROJECT_NOT_FOUND")

    it "logs error and exits when cannot communicate with api", ->
      err = new Error
      err.statusCode = 500
      @createCi.rejects(err)

      cypress.start(["--run-project=#{@todosPath}", "--key=secret-key-123", "--ci"]).then =>
        @expectExitWithErr("CI_CANNOT_COMMUNICATE")

    it "logs error and exits when ci key is missing", ->
      err = new Error
      err.statusCode = 401
      @createCi.rejects(err)

      cypress.start(["--run-project=#{@todosPath}", "--ci"]).then =>
        @expectExitWithErr("CI_KEY_MISSING")

  context "--return-pkg", ->
    beforeEach ->
      @sandbox.stub(console, "log")

    it "logs package.json and exits", ->
      cypress.start(["--return-pkg"]).then =>
        expect(console.log).to.be.calledWithMatch('{"name":"Cypress"')
        @expectExitWith(0)

  context "--version", ->
    beforeEach ->
      @sandbox.stub(console, "log")

    it "logs version and exits", ->
      cypress.start(["--version"]).then =>
        expect(console.log).to.be.calledWith(pkg.version)
        @expectExitWith(0)

  context "--smoke-test", ->
    beforeEach ->
      @sandbox.stub(console, "log")

    it "logs pong value and exits", ->
      cypress.start(["--smoke-test", "--ping=abc123"]).then =>
        expect(console.log).to.be.calledWith("abc123")
        @expectExitWith(0)

  context "--remove-ids", ->
    it "logs stats", ->
      idsPath = Fixtures.projectPath("ids")
      @sandbox.spy(console, "log")

      cypress.start(["--remove-ids", "--project=#{idsPath}"]).then =>
        expect(console.log).to.be.calledWith("Removed '5' ids from '2' files.")
        @expectExitWith(0)

    it "catches errors when project is not found", ->
      cypress.start(["--remove-ids", "--project=path/to/no/project"]).then =>
        @expectExitWithErr("NO_PROJECT_FOUND_AT_PROJECT_ROOT", "path/to/no/project")

  context "headed", ->
    beforeEach ->
      @win = {}
      @sandbox.stub(electron.app, "on").withArgs("ready").yieldsAsync()
      @sandbox.stub(headed, "notify").resolves()
      @sandbox.stub(Renderer, "create").resolves(@win)
      @sandbox.spy(Events, "start")
      @sandbox.stub(Tray, "display")
      @sandbox.stub(electron.ipcMain, "on")

    afterEach ->
      delete process.env.CYPRESS_FILE_SERVER_FOLDER
      delete process.env.CYPRESS_BASE_URL
      delete process.env.CYPRESS_port
      delete process.env.CYPRESS_responseTimeout
      delete process.env.CYPRESS_watch_for_file_changes

    it "passes options to headed.ready", ->
      @sandbox.stub(headed, "ready")

      cypress.start(["--updating", "--port=2121", "--config=pageLoadTimeout=1000"]).then ->
        expect(headed.ready).to.be.calledWithMatch({
          updating: true
          port: 2121
          pageLoadTimeout: 1000
        })

    it "passes options to Events.start", ->
      cypress.start(["--port=2121", "--config=pageLoadTimeout=1000"]).then ->
        expect(Events.start).to.be.calledWithMatch({
          port: 2121,
          pageLoadTimeout: 1000
        })

    it "calls api.updateProject with projectName and session on open", ->
      @sandbox.stub(Server.prototype, "open").resolves()
      @sandbox.stub(api, "updateProject").resolves()

      Promise.all([
        user.set({name: "brian", session_token: "session-123"}),

        Project.add(@todosPath)

        Project.id(@todosPath)
        .then (id) =>
          @projectId = id
      ])
      .then =>
        cypress.start([])
      .then =>
        options = Events.start.firstCall.args[0]
        Events.handleEvent(options, {}, 123, "open:project", @todosPath)
      .delay(100)
      .then =>
        ## must delay here because sync isnt promise connected
        expect(api.updateProject).to.be.calledWith(@projectId, "opened", "todos", "session-123")

    it "calls api.updateProject with projectName and session on close", ->
      @sandbox.stub(Server.prototype, "open").resolves()
      @sandbox.stub(api, "updateProject").resolves()

      Promise.all([
        user.set({name: "brian", session_token: "session-123"}),

        Project.add(@todosPath)

        Project.id(@todosPath)
        .then (id) =>
          @projectId = id
      ])
      .then =>
        cypress.start([])
      .then =>
        options = Events.start.firstCall.args[0]
        Events.handleEvent(options, {}, 123, "open:project", @todosPath)
        .delay(100)
        .then =>
          Events.handleEvent(options, {}, 123, "close:project")
      .delay(100)
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
        user.set({name: "brian", session_token: "session-123"}),

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
        Events.handleEvent(options, {}, 123, "open:project", @todosPath)
      .then =>
        expect(getConfig).to.be.calledWith({
          port: 2121
          pageLoadTimeout: 1000
          sync: true
          changeEvents: true
          type: "opened"
          report: false
          environmentVariables: { baz: "baz" }
        })

        expect(open).to.be.calledWith(@todosPath)
        cfg = open.getCall(0).args[1]

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
