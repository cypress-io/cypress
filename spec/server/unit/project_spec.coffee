require("../spec_helper")

Fixtures     = require("../helpers/fixtures")
api          = require("#{root}lib/api")
user         = require("#{root}lib/user")
cache        = require("#{root}lib/cache")
errors       = require("#{root}lib/errors")
config       = require("#{root}lib/config")
Project      = require("#{root}lib/project")
Settings     = require("#{root}lib/util/settings")

describe "lib/project", ->
  beforeEach ->
    Fixtures.scaffold()

    @todosPath = Fixtures.projectPath("todos")
    @projectId = Settings.readSync(@todosPath).projectId

  afterEach ->
    Fixtures.remove()

  it "requires a projectRoot", ->
    fn = -> Project()
    expect(fn).to.throw "Instantiating lib/project requires a projectRoot!"

  context.skip "#close", ->
    beforeEach ->
      @project = Project("path/to/project")

    it "closes server"

    it "closes watchers"

    it "can close when server + watchers arent open", ->
      @project.close()

    it.skip "calls close once on watchers + socket when app closes", ->
      close1 = @sandbox.stub(Watchers::, "close")
      close2 = @sandbox.stub(Socket::, "close")

      @server.open().then =>
        @server.app.emit("close")
        @server.app.emit("close")

        expect(close1).to.be.calledOnce
        expect(close2).to.be.calledOnce

  context.skip "#open", ->
    it "calls Fixture#scaffold", ->
      @server.open().bind(@).then ->
        expect(Fixture::scaffold).to.be.calledOnce

    it "calls Support#scaffold", ->
      @server.open().bind(@).then ->
        expect(Support::scaffold).to.be.calledOnce

    it "calls project#getDetails", ->
      @server.open().bind(@).then ->
        expect(Project::getDetails).to.be.calledWith("a-long-guid-123")

    it "watches cypress.json", ->
      @server.open().bind(@).then ->
        expect(Watchers::watch).to.be.calledWith("/Users/brian/app/cypress.json")

    it "passes watchers to Socket.startListening", ->
      options = {}

      @server.open(options).then ->
        startListening = Socket::startListening
        expect(startListening.getCall(0).args[0]).to.be.instanceof(Watchers)
        expect(startListening.getCall(0).args[1]).to.eq(options)

    it "calls onReboot when cypress.json changes", ->
      onReboot = @sandbox.spy()

      ## invoke the onChange callback
      Watchers::watch.yieldsTo("onChange")

      @server.open({onReboot: onReboot}).then ->
        expect(onReboot).to.be.calledOnce

  context "#getProjectId", ->
    beforeEach ->
      @project         = Project("path/to/project")
      @verifyExistance = @sandbox.stub(Project.prototype, "verifyExistance").resolves()

    it "calls verifyExistance", ->
      @sandbox.stub(Settings, "read").resolves({projectId: "id-123"})

      @project.getProjectId()
      .then =>
        expect(@verifyExistance).to.be.calledOnce

    it "returns the project id from settings", ->
      @sandbox.stub(Settings, "read").resolves({projectId: "id-123"})

      @project.getProjectId()
      .then (id) ->
        expect(id).to.eq "id-123"

    it "throws NO_PROJECT_ID with the projectRoot when no projectId was found", ->
      @sandbox.stub(Settings, "read").resolves({})

      @project.getProjectId()
      .then (id) ->
        throw new Error("expected to fail, but did not")
      .catch (err) ->
        expect(err.type).to.eq("NO_PROJECT_ID")
        expect(err.message).to.include("path/to/project")

    it "bubbles up Settings.read errors", ->
      err = new Error
      err.code = "EACCES"

      @sandbox.stub(Settings, "read").rejects(err)

      @project.getProjectId()
      .then (id) ->
        throw new Error("expected to fail, but did not")
      .catch (err) ->
        expect(err.code).to.eq("EACCES")

  context "#createProjectId", ->
    beforeEach ->
      @project = Project("path/to/project")
      @sandbox.stub(@project, "writeProjectId").resolves("uuid-123")
      @sandbox.stub(user, "ensureSession").resolves("session-123")
      @sandbox.stub(api, "createProject")
        .withArgs("session-123")
        .resolves("uuid-123")

    afterEach ->
      delete process.env.CYPRESS_PROJECT_ID

    it "calls api.createProject with user session", ->
      @project.createProjectId().then ->
        expect(api.createProject).to.be.calledWith("session-123")

    it "calls writeProjectId with id", ->
      @project.createProjectId().then =>
        expect(@project.writeProjectId).to.be.calledWith("uuid-123")
        expect(@project.writeProjectId).to.be.calledOn(@project)

    it "can set the project id by CYPRESS_PROJECT_ID env", ->
      process.env.CYPRESS_PROJECT_ID = "987-654-321-foo"
      @project.createProjectId().then =>
        expect(@project.writeProjectId).to.be.calledWith("987-654-321-foo")
        expect(@project.writeProjectId).to.be.calledOn(@project)

  context "#writeProjectId", ->
    beforeEach ->
      @project = Project("path/to/project")

      @sandbox.stub(Settings, "write")
        .withArgs(@project.projectRoot, {projectId: "id-123"})
        .resolves({projectId: "id-123"})

    it "calls Settings.write with projectRoot and attrs", ->
      @project.writeProjectId("id-123").then (id) ->
        expect(id).to.eq("id-123")

  context "#ensureProjectId", ->
    beforeEach ->
      @project = Project("path/to/project")

    it "returns the project id", ->
      @sandbox.stub(Project.prototype, "getProjectId").resolves("id-123")

      @project.ensureProjectId()
      .then (id) =>
        expect(id).to.eq "id-123"

    it "calls createProjectId if getProjectId throws NO_PROJECT_ID", ->
      err = errors.get("NO_PROJECT_ID")
      @sandbox.stub(Project.prototype, "getProjectId").rejects(err)
      createProjectId = @sandbox.stub(Project.prototype, "createProjectId").resolves()

      @project.ensureProjectId().then ->
        expect(createProjectId).to.be.calledWith(err)

    it "does not call createProjectId from other errors", ->
      err = new Error
      err.code = "EACCES"
      @sandbox.stub(Project.prototype, "getProjectId").rejects(err)
      createProjectId = @sandbox.spy(Project.prototype, "createProjectId")

      @project.ensureProjectId()
      .catch (e) ->
        expect(e).to.eq(err)
        expect(createProjectId).not.to.be.calledWith(err)

  context ".add", ->
    beforeEach ->
      @pristinePath = Fixtures.projectPath("pristine")
      @sandbox.stub(user, "ensureSession").resolves("session-123")
      @sandbox.stub(api, "createProject").resolves("id-123")

    it "creates a cypress.json in projectRoot", ->
      Project.add(@pristinePath).then =>
        Settings.read(@pristinePath).then (settings) ->
          expect(settings).to.deep.eq({
            projectId: "id-123"
          })

    it "inserts into cache project id + cache", ->
      Project.add(@pristinePath).then =>
        cache.read().then (json) =>
          expect(json.PROJECTS).to.deep.eq({
            "id-123": {PATH: @pristinePath}
          })

    it "resolves with the id", ->
      Project.add(@pristinePath).then (id) ->
        expect(id).to.eq("id-123")

  context ".remove", ->
    beforeEach ->
      @sandbox.stub(cache, "removeProject").resolves()

    it "calls cache.removeProject with path", ->
      Project.remove("path/to/project").then ->
        expect(cache.removeProject).to.be.calledWith("path/to/project")

  context ".exists", ->
    beforeEach ->
      @sandbox.stub(cache, "getProjectPaths").resolves(["foo", "bar", "baz"])

    it "is true if path is in paths", ->
      Project.exists("bar").then (ret) ->
        expect(ret).to.be.true

    it "is false if path isnt in paths", ->
      Project.exists("quux").then (ret) ->
        expect(ret).to.be.false

  context ".id", ->

  context ".paths", ->
    beforeEach ->
      @sandbox.stub(cache, "getProjectPaths").resolves([])

    it "calls cache.getProjectPaths", ->
      Project.paths().then (ret) ->
        expect(ret).to.deep.eq([])
        expect(cache.getProjectPaths).to.be.calledOnce

  context ".getSecretKeyByPath", ->
    beforeEach ->
      @sandbox.stub(user, "ensureSession").resolves("session-123")

    it "calls api.getProjectToken with id + session", ->
      @sandbox.stub(api, "getProjectToken")
        .withArgs(@projectId, "session-123")
        .resolves("key-123")

      Project.getSecretKeyByPath(@todosPath).then (key) ->
        expect(key).to.eq("key-123")

    it "throws CANNOT_FETCH_PROJECT_TOKEN on error", ->
      @sandbox.stub(api, "getProjectToken")
        .withArgs(@projectId, "session-123")
        .rejects(new Error)

      Project.getSecretKeyByPath(@todosPath)
      .then ->
        throw new Error("should have caught error but did not")
      .catch (err) ->
        expect(err.type).to.eq("CANNOT_FETCH_PROJECT_TOKEN")

  context ".generateSecretKeyByPath", ->
    beforeEach ->
      @sandbox.stub(user, "ensureSession").resolves("session-123")

    it "calls api.updateProject with id + session", ->
      @sandbox.stub(api, "updateProjectToken")
        .withArgs(@projectId, "session-123")
        .resolves("new-key-123")

      Project.generateSecretKeyByPath(@todosPath).then (key) ->
        expect(key).to.eq("new-key-123")

    it "throws CANNOT_CREATE_PROJECT_TOKEN on error", ->
      @sandbox.stub(api, "updateProjectToken")
        .withArgs(@projectId, "session-123")
        .rejects(new Error)

      Project.generateSecretKeyByPath(@todosPath)
      .then ->
        throw new Error("should have caught error but did not")
      .catch (err) ->
        expect(err.type).to.eq("CANNOT_CREATE_PROJECT_TOKEN")
