require("../spec_helper")

os       = require("os")
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

  after ->
    mockery.disable()

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

    it "runs project headlessly and exits with status 0", ->
      @sandbox.stub(headless, "runTests").resolves({
        connection: null
        renderer: null
        stats: {failures: 10}
      })

      Promise.all([
        user.set({name: "brian", session_token: "session-123"}),

        Project.add(@todosPath).then (id) =>
          @projectId = id
      ])
      .then =>
        cypress.start(["--run-project=#{@todosPath}"]).then =>
          @expectExitWith(0)

    it "prompts to add the project and then immediately runs the tests and exits with 0", ->
      @sandbox.stub(inquirer, "prompt").yieldsAsync({add: true})
      @sandbox.stub(headless, "runTests").resolves({
        connection: null
        renderer: null
        stats: {failures: 10}
      })

      user.set({session_token: "session-123"})
      .then =>
        cypress.start(["--run-project=#{@todosPath}"]).then =>
          expect(inquirer.prompt).to.be.calledOnce
          @expectExitWith(0)

    ## TODO implement the running of a specific spec by its options
    ## instead of running all of the tests
    it.skip "runs project by specific spec and exits with status 0", ->

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

        Project.add(@todosPath).then (id) =>
          @projectId = id
      ])
      .then =>
        ## remove the cypress.json id from cypress.json on todos project
        ## after adding this to the cache
        Settings.write(@todosPath, {projectId: null})
      .then =>
        cypress.start(["--run-project=#{@todosPath}"]).then =>
          @expectExitWithErr("??")

    describe "--port", ->
      beforeEach ->
        @sandbox.stub(headless, "runTests").resolves({
          connection: null
          renderer: null
          stats: {}
        })

        Promise.all([
          user.set({name: "brian", session_token: "session-123"}),

          Project.add(@todosPath).then (id) =>
            @projectId = id
        ])

      it "can change the default port to 5555", ->
        listen = @sandbox.spy(http.Server.prototype, "listen")
        open   = @sandbox.spy(Server.prototype, "open")

        cypress.start(["--run-project=#{@todosPath}", "--port=5555"]).then =>
          expect(project.opened().getConfig().port).to.eq(5555)
          expect(listen).to.be.calledWith(5555)
          expect(open).to.be.calledWithMatch({port: 5555})
          @expectExitWith(0)

      ## TODO: handle PORT_IN_USE short + long descriptions
      it "logs error and exits when port is in use", ->
        server = http.createServer()
        server = Promise.promisifyAll(server)
        server.listenAsync(5555)
        .then =>
          cypress.start(["--run-project=#{@todosPath}", "--port=5555"]).then =>
            @expectExitWithErr("PORT_IN_USE", "5555")

    describe "--env", ->
      beforeEach ->
        @sandbox.stub(headless, "runTests").resolves({
          connection: null
          renderer: null
          stats: {}
        })

        Promise.all([
          user.set({name: "brian", session_token: "session-123"}),

          Project.add(@todosPath).then (id) =>
            @projectId = id
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
        user.set({name: "brian", session_token: "session-123"}),

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

    it "logs error and exits when cannot communicate with api", ->
      err = new Error
      err.statusCode = 404
      @createCiGuid.rejects(err)

      cypress.start(["--run-project=#{@todosPath}", "--key=secret-key-123", "--ci"]).then =>
        @expectExitWithErr("CI_CANNOT_COMMUNICATE")

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

