require("../spec_helper")

os       = require("os")
path     = require("path")
http     = require("http")
electron = require("electron")
inquirer = require("inquirer")
Fixtures = require("../helpers/fixtures")
Settings = require("#{root}lib/util/settings")
project  = require("#{root}lib/electron/handlers/project")
ci       = require("#{root}lib/modes/ci")
headed   = require("#{root}lib/modes/headed")
headless = require("#{root}lib/modes/headless")
api      = require("#{root}lib/api")
user     = require("#{root}lib/user")
cache    = require("#{root}lib/cache")
errors   = require("#{root}lib/errors")
cypress  = require("#{root}lib/cypress")
Project  = require("#{root}lib/project")
Server   = require("#{root}lib/server")

describe "lib/cypress", ->
  beforeEach ->
    cache.removeSync()

    Fixtures.scaffold()
    @todosPath = Fixtures.projectPath("todos")

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

        Project.add(@todosPath).then (id) =>
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
      @pristinePath = Fixtures.projectPath("pristine")

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

        Project.add(@todosPath).then (id) =>
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

        Project.add(@todosPath).then (id) =>
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
      @pristinePath = Fixtures.projectPath("pristine")

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

        Project.add(@todosPath).then (id) =>
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

    ## Currently this is not an error, all this does is simply run the tests
    ## without an id
    ## TODO
    ## consider removing the cache holding onto the project id as this can
    ## get stale very quickly
    ## consider only ever looking at the project's ID based on its cypress.json
    it.skip "logs error and exits when project does not have an id", ->
      @sandbox.stub(inquirer, "prompt").yieldsAsync({add: true})

      Promise.all([
        user.set({name: "brian", session_token: "session-123"}),

        Project.add(@todosPath)
      ])
      .then =>
        ## remove the cypress.json id from cypress.json on todos project
        ## after adding this to the cache
        Settings.write(@todosPath, {projectId: null})
      .then =>
        cypress.start(["--run-project=#{@todosPath}"]).then =>
          @expectExitWithErr("??")

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
          expect(project.opened().getConfig().port).to.eq(5555)
          expect(listen).to.be.calledWith(5555)
          expect(open).to.be.calledWithMatch({port: 5555})
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
          expect(project.opened().getConfig().environmentVariables).to.deep.eq({
            version: "0.12.1"
            foo: "bar"
            host: "http://localhost:8888"
          })

          @expectExitWith(0)

  ## the majority of the logic in CI is covered already
  ## in --run-project specs above
  context "--ci", ->
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
        user.set({}),

        Project.add(@todosPath).then (id) =>
          @projectId = id
      ])
      .then =>
        @createCiGuid = @sandbox.stub(api, "createCiGuid").withArgs({
          key: "secret-key-123"
          projectId: @projectId
          branch: "bem/ci"
          author: "brian"
          message: "foo"
        })

    it "runs project in ci and exits with number of failures", ->
      @createCiGuid.resolves("ci_guid-123")

      cypress.start(["--run-project=#{@todosPath}", "--key=secret-key-123", "--ci"]).then =>
        @expectExitWith(10)

    it "logs error and exits when ci key is not valid", ->
      err = new Error
      err.statusCode = 401
      @createCiGuid.rejects(err)

      cypress.start(["--run-project=#{@todosPath}", "--key=secret-key-123", "--ci"]).then =>
        @expectExitWithErr("CI_KEY_NOT_VALID", "secre...y-123")

    it "logs error and exits when project could not be found", ->
      err = new Error
      err.statusCode = 404
      @createCiGuid.rejects(err)

      cypress.start(["--run-project=#{@todosPath}", "--key=secret-key-123", "--ci"]).then =>
        @expectExitWithErr("CI_PROJECT_NOT_FOUND")

    it "logs error and exits when cannot communicate with api", ->
      err = new Error
      err.statusCode = 500
      @createCiGuid.rejects(err)

      cypress.start(["--run-project=#{@todosPath}", "--key=secret-key-123", "--ci"]).then =>
        @expectExitWithErr("CI_CANNOT_COMMUNICATE")

    it "logs error and exits when ci key is missing", ->
      err = new Error
      err.statusCode = 401
      @createCiGuid.rejects(err)

      cypress.start(["--run-project=#{@todosPath}", "--ci"]).then =>
        @expectExitWithErr("CI_KEY_MISSING")

  context "--return-pkg", ->
    beforeEach ->
      @sandbox.stub(console, "log")

    it "logs package.json and exits", ->
      cypress.start(["--return-pkg"]).then =>
        expect(console.log).to.be.calledWithMatch('{"name":"Cypress"')
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

  context "no args", ->
    beforeEach ->
      @sandbox.stub(electron.app, "on").withArgs("ready").yieldsAsync()
      @sandbox.stub(headed, "ready").resolves()

    it "runs headed and does not exit", ->
      cypress.start().then ->
        expect(headed.ready).to.be.calledOnce

    it "passes options to headed.ready", ->
      cypress.start(["--updating"]).then ->
        expect(headed.ready).to.be.calledWithMatch({updating: true})

