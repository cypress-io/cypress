require("../spec_helper")

path         = require("path")
Promise      = require("bluebird")
Fixtures     = require("../helpers/fixtures")
ids          = require("#{root}lib/ids")
api          = require("#{root}lib/api")
user         = require("#{root}lib/user")
cache        = require("#{root}lib/cache")
errors       = require("#{root}lib/errors")
config       = require("#{root}lib/config")
scaffold     = require("#{root}lib/scaffold")
Project      = require("#{root}lib/project")
settings     = require("#{root}lib/util/settings")

describe "lib/project", ->
  beforeEach ->
    Fixtures.scaffold()

    @todosPath    = Fixtures.projectPath("todos")
    @idsPath      = Fixtures.projectPath("ids")
    @pristinePath = Fixtures.projectPath("pristine")

    settings.read(@todosPath).then (obj = {}) =>
      {@projectId} = obj

      @config  = config.set({projectName: "project"})
      @project = Project(@todosPath)

  afterEach ->
    Fixtures.remove()

  it "requires a projectRoot", ->
    fn = -> Project()
    expect(fn).to.throw "Instantiating lib/project requires a projectRoot!"

  it "always resolves the projectRoot to be absolute", ->
    p = Project("../foo/bar")
    expect(p.projectRoot).not.to.eq("../foo/bar")
    expect(p.projectRoot).to.eq(path.resolve("../foo/bar"))

  context "#getConfig", ->
    beforeEach ->
      @sandbox.stub(config, "get").withArgs(@todosPath, {foo: "bar"}).resolves({baz: "quux"})

    it "calls config.get with projectRoot + options", ->
      @project.getConfig({foo: "bar"})
      .then (cfg) ->
        expect(cfg).to.deep.eq({baz: "quux"})

    it "resolves if cfg is already set", ->
      @project.cfg = {foo: "bar"}

      @project.getConfig()
      .then (cfg) ->
        expect(cfg).to.deep.eq({foo: "bar"})

  context "#open", ->
    beforeEach ->
      @sandbox.stub(@project, "watchSettingsAndStartWebsockets").resolves()
      @sandbox.stub(@project, "ensureProjectId").resolves("id-123")
      @sandbox.stub(@project, "updateProject").withArgs("id-123", "opened").resolves()
      @sandbox.stub(@project, "scaffold").resolves()
      @sandbox.stub(@project, "getConfig").resolves(@config)
      @sandbox.stub(@project.server, "open").resolves()

    it "sets changeEvents to false by default", ->
      opts = {}
      @project.open(opts).then ->
        expect(opts.changeEvents).to.be.false

    it "sets updateProject to false by default", ->
      opts = {}
      @project.open(opts).then ->
        expect(opts.sync).to.be.false

    it "sets type to opened by default", ->
      opts = {}
      @project.open(opts).then ->
        expect(opts.type).to.eq("opened")

    it "calls #watchSettingsAndStartWebsockets with options.changeEvents + config", ->
      opts = {changeEvents: false, onAutomationRequest: ->}
      @project.cfg = {}
      @project.open(opts).then =>
        expect(@project.watchSettingsAndStartWebsockets).to.be.calledWith(false, opts.onAutomationRequest, @project.cfg)

    it "calls #scaffold with server config", ->
      @project.open().then =>
        expect(@project.scaffold).to.be.calledWith(@config)

    it "calls #getConfig options", ->
      opts = {}
      @project.open(opts).then =>
        expect(@project.getConfig).to.be.calledWith(opts)

    it "passes id + options to updateProject", ->
      opts = {}

      @project.open(opts).then =>
        expect(@project.updateProject).to.be.calledWith("id-123", opts)

    it "swallows errors from ensureProjectId", ->
      @project.ensureProjectId.rejects(new Error)
      @project.open()

    it "swallows errors from updateProject", ->
      @project.updateProject.rejects(new Error)
      @project.open()

    it "does not wait on ensureProjectId", ->
      @project.ensureProjectId.resolves(Promise.delay(10000))
      @project.open()

    it "does not wait on updateProject", ->
      @project.updateProject.resolves(Promise.delay(10000))
      @project.open()

    it.skip "watches cypress.json", ->
      @server.open().bind(@).then ->
        expect(Watchers::watch).to.be.calledWith("/Users/brian/app/cypress.json")

    it.skip "passes watchers to Socket.startListening", ->
      options = {}

      @server.open(options).then ->
        startListening = Socket::startListening
        expect(startListening.getCall(0).args[0]).to.be.instanceof(Watchers)
        expect(startListening.getCall(0).args[1]).to.eq(options)

  context "#close", ->
    beforeEach ->
      @project = Project("path/to/project")

      @sandbox.stub(@project, "getConfig").resolves(@config)
      @sandbox.stub(@project, "ensureProjectId").resolves("id-123")
      @sandbox.stub(api, "updateProject").withArgs("id-123", "closed", "project", "session-123").resolves({})
      @sandbox.stub(user, "ensureSession").resolves("session-123")

    it "closes server", ->
      @project.server = @sandbox.stub({close: ->})

      @project.close().then =>
        expect(@project.server.close).to.be.calledOnce

    it "closes watchers", ->
      @project.watchers = @sandbox.stub({close: ->})

      @project.close().then =>
        expect(@project.watchers.close).to.be.calledOnce

    it "does not sync by default", ->
      opts = {}

      @project.close(opts).then ->
        expect(opts.sync).to.be.false
        Promise.delay(100).then ->
          expect(api.updateProject).not.to.be.called

    it "can sync", ->
      @project.close({sync: true}).then ->
        Promise.delay(100).then ->
          expect(api.updateProject).to.be.called

    it "can close when server + watchers arent open", ->
      @project.close()

    it "removes listeners", ->
      @project.on "foo", ->

      expect(@project.listeners("foo").length).to.eq(1)

      @project.close().then =>
        expect(@project.listeners("foo").length).to.be.eq(0)

  context "#determineIsNewProject", ->
    it "is false when files.length isnt 1", ->
      id = =>
        @ids = Project(@idsPath)
        @ids.getConfig()
        .then (cfg) =>
          @ids.scaffold(cfg).return(cfg)
        .then (cfg) =>
          @ids.determineIsNewProject(cfg.integrationFolder)
        .then (ret) ->
          expect(ret).to.be.false

      todo = =>
        @todos = Project(@todosPath)
        @todos.getConfig()
        .then (cfg) =>
          @todos.scaffold(cfg).return(cfg)
        .then (cfg) =>
          @todos.determineIsNewProject(cfg.integrationFolder)
        .then (ret) ->
          expect(ret).to.be.false

      Promise.join(id, todo)

    it "is true when files, name + bytes match to scaffold", ->
      pristine = Project(@pristinePath)
      pristine.getConfig()
      .then (cfg) ->
        pristine.scaffold(cfg).return(cfg)
      .then (cfg) ->
        pristine.determineIsNewProject(cfg.integrationFolder)
      .then (ret) ->
        expect(ret).to.be.true

    it "is false when bytes dont match scaffold", ->
      pristine = Project(@pristinePath)
      pristine.getConfig()
      .then (cfg) ->
        pristine.scaffold(cfg).return(cfg)
      .then (cfg) ->
        example = scaffold.integrationExampleName()
        file    = path.join(cfg.integrationFolder, example)

        ## write some data to the file so it is now
        ## different in file size
        fs.readFileAsync(file, "utf8")
        .then (str) ->
          str += "foo bar baz"
          fs.writeFileAsync(file, str).return(cfg)
      .then (cfg) ->
        pristine.determineIsNewProject(cfg.integrationFolder)
      .then (ret) ->
        expect(ret).to.be.false

  context "#updateProject", ->
    beforeEach ->
      @project = Project("path/to/project")
      @sandbox.stub(@project, "getConfig").resolves(@config)
      @sandbox.stub(api, "updateProject").resolves({})
      @sandbox.stub(user, "ensureSession").resolves("session-123")

    it "is noop if options.updateProject isnt true", ->
      @project.updateProject(1).then ->
        expect(api.updateProject).not.to.be.called

    it "calls api.updateProject with id + session", ->
      @project.updateProject("project-123", {sync: true, type: "opened"}).then ->
        expect(api.updateProject).to.be.calledWith("project-123", "opened", "project", "session-123")

  context "#scaffold", ->
    beforeEach ->
      @project = Project("path/to/project")
      @sandbox.stub(scaffold, "integration").resolves()
      @sandbox.stub(scaffold, "fixture").resolves()
      @sandbox.stub(scaffold, "support").resolves()

      @obj = {projectRoot: "pr", fixturesFolder: "ff", supportFolder: "sf", integrationFolder: "if"}

    it "calls scaffold.integration with integrationFolder", ->
      @project.scaffold(@obj).then =>
        expect(scaffold.integration).to.be.calledWith(@obj.integrationFolder)

    it "calls fixture.scaffold with fixturesFolder", ->
      @project.scaffold(@obj).then =>
        expect(scaffold.fixture).to.be.calledWith(@obj.fixturesFolder)

    it "calls support.scaffold with supportFolder", ->
      @project.scaffold(@obj).then =>
        expect(scaffold.support).to.be.calledWith(@obj.supportFolder)

  context "#watchSettings", ->
    beforeEach ->
      @project = Project("path/to/project")
      @project.server = {startWebsockets: ->}
      @watch = @sandbox.stub(@project.watchers, "watch")

    it "sets onChange event when {changeEvents: true}", (done) ->
      @project.watchSettingsAndStartWebsockets(true)

      ## get the object passed to watchers.watch
      obj = @watch.getCall(0).args[1]

      @project.on "settings:changed", done

      expect(obj.onChange).to.be.a("function")
      obj.onChange()

    it "does not call watch when {changeEvents: false}", ->
      @project.watchSettingsAndStartWebsockets(false)

      expect(@watch).not.to.be.called

    it "does not emit settings:changed when generatedProjectIdTimestamp is less than 1 second", ->
      @project.generatedProjectIdTimestamp = timestamp = new Date

      emit = @sandbox.spy(@project, "emit")

      @project.watchSettingsAndStartWebsockets(true)

      ## get the object passed to watchers.watch
      obj = @watch.getCall(0).args[1]
      obj.onChange()

      expect(emit).not.to.be.called

      ## subtract 1 second from our timestamp
      timestamp.setSeconds(timestamp.getSeconds() - 1)

      obj.onChange()

      expect(emit).to.be.calledWith("settings:changed")

  context "#watchSettingsAndStartWebsockets", ->
    beforeEach ->
      @project = Project("path/to/project")
      @project.watchers = {}
      @project.server = @sandbox.stub({startWebsockets: ->})
      @sandbox.stub(@project, "watchSettings")

    it "calls server.startWebsockets with watchers + config", ->
      fn = ->

      @project.watchSettingsAndStartWebsockets({}, fn, 2)

      expect(@project.server.startWebsockets).to.be.calledWith(@project.watchers, 2)

    it "passes onIsNewProject callback", ->
      @sandbox.stub(@project, "determineIsNewProject")

      @project.server.startWebsockets.yieldsTo("onIsNewProject")

      @project.watchSettingsAndStartWebsockets({}, (->), {
        integrationFolder: "foo/bar/baz"
      })

      expect(@project.determineIsNewProject).to.be.calledWith("foo/bar/baz")

    it "passes onAutomationRequest callback", ->
      fn = @sandbox.stub()

      @project.server.startWebsockets.yieldsTo("onAutomationRequest")

      @project.watchSettingsAndStartWebsockets({}, fn, {})

      expect(fn).to.be.calledOnce

  context "#getProjectId", ->
    afterEach ->
      delete process.env.CYPRESS_PROJECT_ID

    beforeEach ->
      @project         = Project("path/to/project")
      @verifyExistance = @sandbox.stub(Project.prototype, "verifyExistance").resolves()

    it "resolves with process.env.CYPRESS_PROJECT_ID if set", ->
      process.env.CYPRESS_PROJECT_ID = "123"

      @project.getProjectId().then (id) ->
        expect(id).to.eq("123")

    it "calls verifyExistance", ->
      @sandbox.stub(settings, "read").resolves({projectId: "id-123"})

      @project.getProjectId()
      .then =>
        expect(@verifyExistance).to.be.calledOnce

    it "returns the project id from settings", ->
      @sandbox.stub(settings, "read").resolves({projectId: "id-123"})

      @project.getProjectId()
      .then (id) ->
        expect(id).to.eq "id-123"

    it "throws NO_PROJECT_ID with the projectRoot when no projectId was found", ->
      @sandbox.stub(settings, "read").resolves({})

      @project.getProjectId()
      .then (id) ->
        throw new Error("expected to fail, but did not")
      .catch (err) ->
        expect(err.type).to.eq("NO_PROJECT_ID")
        expect(err.message).to.include("path/to/project")

    it "bubbles up Settings.read errors", ->
      err = new Error
      err.code = "EACCES"

      @sandbox.stub(settings, "read").rejects(err)

      @project.getProjectId()
      .then (id) ->
        throw new Error("expected to fail, but did not")
      .catch (err) ->
        expect(err.code).to.eq("EACCES")

  context "#createProjectId", ->
    beforeEach ->
      @project = Project("path/to/project")
      @sandbox.stub(@project, "getConfig").resolves(@config)
      @sandbox.stub(@project, "writeProjectId").resolves("uuid-123")
      @sandbox.stub(user, "ensureSession").resolves("session-123")
      @sandbox.stub(api, "createProject")
        .withArgs("project", "session-123")
        .resolves("uuid-123")

    afterEach ->
      delete process.env.CYPRESS_PROJECT_ID

    it "calls api.createProject with user session", ->
      @project.createProjectId().then ->
        expect(api.createProject).to.be.calledWith("project", "session-123")

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

      @sandbox.stub(settings, "write")
        .withArgs(@project.projectRoot, {projectId: "id-123"})
        .resolves({projectId: "id-123"})

    it "calls Settings.write with projectRoot and attrs", ->
      @project.writeProjectId("id-123").then (id) ->
        expect(id).to.eq("id-123")

    it "sets generatedProjectIdTimestamp", ->
      @project.writeProjectId("id-123").then =>
        expect(@project.generatedProjectIdTimestamp).to.be.a("date")

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

  context "#ensureSpecUrl", ->
    beforeEach ->
      @project2 = Project(@idsPath)

    it "returns fully qualified url when spec exists", ->
      @project2.ensureSpecUrl("cypress/integration/bar.js")
      .then (str) ->
        expect(str).to.eq("http://localhost:2020/__/#/tests/integration/bar.js?__ui=satellite")

    it "returns fully qualified url on absolute path to spec", ->
      todosSpec = path.join(@todosPath, "tests/sub/sub_test.coffee")
      @project.ensureSpecUrl(todosSpec)
      .then (str) ->
        expect(str).to.eq("http://localhost:8888/__/#/tests/integration/sub/sub_test.coffee?__ui=satellite")

    it "returns __all spec url", ->
      @project.ensureSpecUrl()
      .then (str) ->
        expect(str).to.eq("http://localhost:8888/__/#/tests/__all?__ui=satellite")

    it "throws when spec isnt found", ->
      @project.ensureSpecUrl("does/not/exist.js")
      .catch (err) ->
        expect(err.type).to.eq("SPEC_FILE_NOT_FOUND")

  context "#ensureSpecExists", ->
    beforeEach ->
      @project2 = Project(@idsPath)

    it "resolves relative path to test file against projectRoot", ->
      @project2.ensureSpecExists("cypress/integration/foo.coffee")
      .then =>
        @project.ensureSpecExists("tests/test1.js")

    it "resolves + returns absolute path to test file", ->
      idsSpec   = path.join(@idsPath, "cypress/integration/foo.coffee")
      todosSpec = path.join(@todosPath, "tests/sub/sub_test.coffee")

      @project2.ensureSpecExists(idsSpec)
      .then (spec1) =>
        expect(spec1).to.eq(idsSpec)

        @project.ensureSpecExists(todosSpec)
      .then (spec2) ->
        expect(spec2).to.eq(todosSpec)

    it "throws SPEC_FILE_NOT_FOUND when spec does not exist", ->
      @project2.ensureSpecExists("does/not/exist.js")
      .catch (err) =>
        expect(err.type).to.eq("SPEC_FILE_NOT_FOUND")
        expect(err.message).to.include(path.join(@idsPath, "does/not/exist.js"))

  context ".add", ->
    beforeEach ->
      @pristinePath = Fixtures.projectPath("pristine")

    it "inserts into cache project id + cache", ->
      Project.add(@pristinePath)
      .then =>
        cache.read()
      .then (json) =>
        expect(json.PROJECTS).to.deep.eq([@pristinePath])

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
    it "returns project id", ->
      Project.id(@todosPath).then (id) =>
        expect(id).to.eq(@projectId)

  context ".paths", ->
    beforeEach ->
      @sandbox.stub(cache, "getProjectPaths").resolves([])

    it "calls cache.getProjectPaths", ->
      Project.paths().then (ret) ->
        expect(ret).to.deep.eq([])
        expect(cache.getProjectPaths).to.be.calledOnce

  context ".removeIds", ->
    beforeEach ->
      @sandbox.stub(ids, "remove").resolves({})

    it "calls id.remove with path to project tests", ->
      p = Fixtures.projectPath("ids")

      Project.removeIds(p).then ->
        expect(ids.remove).to.be.calledWith(p + "/cypress/integration")

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
