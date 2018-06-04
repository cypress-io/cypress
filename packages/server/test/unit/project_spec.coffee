require("../spec_helper")

path         = require("path")
Promise      = require("bluebird")
commitInfo   = require("@cypress/commit-info")
Fixtures     = require("../support/helpers/fixtures")
api          = require("#{root}lib/api")
user         = require("#{root}lib/user")
cache        = require("#{root}lib/cache")
errors       = require("#{root}lib/errors")
config       = require("#{root}lib/config")
scaffold     = require("#{root}lib/scaffold")
Server       = require("#{root}lib/server")
Project      = require("#{root}lib/project")
Automation   = require("#{root}lib/automation")
savedState   = require("#{root}lib/saved_state")
preprocessor = require("#{root}lib/plugins/preprocessor")
plugins      = require("#{root}lib/plugins")
fs           = require("#{root}lib/util/fs")
settings     = require("#{root}lib/util/settings")

describe "lib/project", ->
  beforeEach ->
    Fixtures.scaffold()

    @todosPath    = Fixtures.projectPath("todos")
    @idsPath      = Fixtures.projectPath("ids")
    @pristinePath = Fixtures.projectPath("pristine")

    settings.read(@todosPath).then (obj = {}) =>
      {@projectId} = obj

      config.set({projectName: "project", projectRoot: "/foo/bar"})
      .then (@config) =>
        @project = Project(@todosPath)

  afterEach ->
    Fixtures.remove()
    @project?.close()

  it "requires a projectRoot", ->
    fn = -> Project()
    expect(fn).to.throw "Instantiating lib/project requires a projectRoot!"

  it "always resolves the projectRoot to be absolute", ->
    p = Project("../foo/bar")
    expect(p.projectRoot).not.to.eq("../foo/bar")
    expect(p.projectRoot).to.eq(path.resolve("../foo/bar"))

  context "#saveState", ->
    beforeEach ->
      integrationFolder = "the/save/state/test"
      sinon.stub(config, "get").withArgs(@todosPath).resolves({ integrationFolder })
      sinon.stub(@project, "determineIsNewProject").withArgs(integrationFolder).resolves(false)
      @project.cfg = { integrationFolder }
      savedState(@project.projectRoot)
      .then (state) -> state.remove()

    afterEach ->
      savedState(@project.projectRoot)
      .then (state) -> state.remove()

    it "saves state without modification", ->
      @project.saveState()
      .then (state) ->
        expect(state).to.deep.eq({})

    it "adds property", ->
      @project.saveState()
      .then () => @project.saveState({ foo: 42 })
      .then (state) ->
        expect(state).to.deep.eq({ foo: 42 })

    it "adds second property", ->
      @project.saveState()
      .then () => @project.saveState({ foo: 42 })
      .then () => @project.saveState({ bar: true })
      .then (state) ->
        expect(state).to.deep.eq({ foo: 42, bar: true })

    it "modifes property", ->
      @project.saveState()
      .then () => @project.saveState({ foo: 42 })
      .then () => @project.saveState({ foo: 'modified' })
      .then (state) ->
        expect(state).to.deep.eq({ foo: 'modified' })

  context "#getConfig", ->
    integrationFolder = "foo/bar/baz"
    beforeEach ->
      sinon.stub(config, "get").withArgs(@todosPath, {foo: "bar"}).resolves({ baz: "quux", integrationFolder })
      sinon.stub(@project, "determineIsNewProject").withArgs(integrationFolder).resolves(false)

    it "calls config.get with projectRoot + options + saved state", ->
      savedState(@todosPath)
      .then (state) =>
        sinon.stub(state, "get").resolves({ reporterWidth: 225 })
        @project.getConfig({foo: "bar"})
        .then (cfg) ->
          expect(cfg).to.deep.eq({
            integrationFolder
            isNewProject: false
            baz: "quux"
            state: {
              reporterWidth: 225
            }
          })

    it "resolves if cfg is already set", ->
      @project.cfg = {
        integrationFolder: integrationFolder,
        foo: "bar"
      }

      @project.getConfig()
      .then (cfg) ->
        expect(cfg).to.deep.eq({
          integrationFolder: integrationFolder,
          foo: "bar"
        })

    it "sets cfg.isNewProject to true when state.showedOnBoardingModal is true", ->
      savedState(@todosPath)
      .then (state) =>
        sinon.stub(state, "get").resolves({ showedOnBoardingModal: true })

        @project.getConfig({foo: "bar"})
        .then (cfg) ->
          expect(cfg).to.deep.eq({
            integrationFolder
            isNewProject: false
            baz: "quux"
            state: {
              showedOnBoardingModal: true
            }
          })

  context "#open", ->
    beforeEach ->
      sinon.stub(@project, "watchSettingsAndStartWebsockets").resolves()
      sinon.stub(@project, "checkSupportFile").resolves()
      sinon.stub(@project, "scaffold").resolves()
      sinon.stub(@project, "getConfig").resolves(@config)
      sinon.stub(Server.prototype, "open").resolves([])
      sinon.stub(Server.prototype, "reset")
      sinon.stub(config, "updateWithPluginValues").returns(@config)
      sinon.stub(scaffold, "plugins").resolves()
      sinon.stub(plugins, "init").resolves()

    it "calls #watchSettingsAndStartWebsockets with options + config", ->
      opts = {changeEvents: false, onAutomationRequest: ->}
      @project.cfg = {}
      @project.open(opts).then =>
        expect(@project.watchSettingsAndStartWebsockets).to.be.calledWith(opts, @project.cfg)

    it "calls #scaffold with server config promise", ->
      @project.open().then =>
        expect(@project.scaffold).to.be.calledWith(@config)

    it "calls #checkSupportFile with server config when scaffolding is finished", ->
      @project.open().then =>
        expect(@project.checkSupportFile).to.be.calledWith(@config)

    it "calls #getConfig options", ->
      opts = {}
      @project.open(opts).then =>
        expect(@project.getConfig).to.be.calledWith(opts)

    it "initializes the plugins", ->
      @project.open({}).then =>
        expect(plugins.init).to.be.called

    it "calls support.plugins with pluginsFile directory", ->
      @project.open({}).then =>
        expect(scaffold.plugins).to.be.calledWith(path.dirname(@config.pluginsFile))

    it "calls options.onError with plugins error when there is a plugins error", ->
      onError = sinon.spy()
      err = {
        name: "plugin error name"
        message: "plugin error message"
      }
      @project.open({ onError: onError }).then =>
        pluginsOnError = plugins.init.lastCall.args[1].onError
        expect(pluginsOnError).to.be.a("function")
        pluginsOnError(err)
        expect(onError).to.be.calledWith(err)

    it "updates config.state when saved state changes", ->
      sinon.spy(@project, "saveState")

      options = {}

      @project.open(options)
      .then =>
        options.onSavedStateChanged({ autoScrollingEnabled: false })
      .then =>
        @project.getConfig()
      .then (config) =>
        expect(@project.saveState).to.be.calledWith({ autoScrollingEnabled: false})
        expect(config.state).to.eql({ autoScrollingEnabled: false })

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
      @project = Project("/_test-output/path/to/project")

      sinon.stub(@project, "getConfig").resolves(@config)
      sinon.stub(user, "ensureAuthToken").resolves("auth-token-123")

    it "closes server", ->
      @project.server = sinon.stub({close: ->})

      @project.close().then =>
        expect(@project.server.close).to.be.calledOnce

    it "closes watchers", ->
      @project.watchers = sinon.stub({close: ->})

      @project.close().then =>
        expect(@project.watchers.close).to.be.calledOnce

    it "can close when server + watchers arent open", ->
      @project.close()

  context "#reset", ->
    beforeEach ->
      @project = Project(@pristinePath)
      @project.automation = { reset: sinon.stub() }
      @project.server = { reset: sinon.stub() }

    it "resets server + automation", ->
      @project.reset()
      .then =>
        expect(@project.automation.reset).to.be.calledOnce
        expect(@project.server.reset).to.be.calledOnce

  context "#getRuns", ->
    beforeEach ->
      @project = Project(@todosPath)
      sinon.stub(settings, "read").resolves({projectId: "id-123"})
      sinon.stub(api, "getProjectRuns").resolves('runs')
      sinon.stub(user, "ensureAuthToken").resolves("auth-token-123")

    it "calls api.getProjectRuns with project id + session", ->
      @project.getRuns().then (runs) ->
        expect(api.getProjectRuns).to.be.calledWith("id-123", "auth-token-123")
        expect(runs).to.equal("runs")

  context "#scaffold", ->
    beforeEach ->
      @project = Project("/_test-output/path/to/project")
      sinon.stub(scaffold, "integration").resolves()
      sinon.stub(scaffold, "fixture").resolves()
      sinon.stub(scaffold, "support").resolves()
      sinon.stub(scaffold, "plugins").resolves()

      @obj = {projectRoot: "pr", fixturesFolder: "ff", integrationFolder: "if", supportFolder: "sf", pluginsFile: "pf/index.js"}

    it "calls scaffold.integration with integrationFolder", ->
      @project.scaffold(@obj).then =>
        expect(scaffold.integration).to.be.calledWith(@obj.integrationFolder)

    it "calls fixture.scaffold with fixturesFolder", ->
      @project.scaffold(@obj).then =>
        expect(scaffold.fixture).to.be.calledWith(@obj.fixturesFolder)

    it "calls support.scaffold with supportFolder", ->
      @project.scaffold(@obj).then =>
        expect(scaffold.support).to.be.calledWith(@obj.supportFolder)

    it "does not call support.plugins if config.pluginsFile is falsey", ->
      @obj.pluginsFile = false
      @project.scaffold(@obj).then =>
        expect(scaffold.plugins).not.to.be.called

  context "#watchSettings", ->
    beforeEach ->
      @project = Project("/_test-output/path/to/project")
      @project.server = {startWebsockets: ->}
      sinon.stub(settings, "pathToCypressJson").returns("/path/to/cypress.json")
      sinon.stub(settings, "pathToCypressEnvJson").returns("/path/to/cypress.env.json")
      @watch = sinon.stub(@project.watchers, "watch")

    it "watches cypress.json and cypress.env.json", ->
      @project.watchSettingsAndStartWebsockets({onSettingsChanged: ->})
      expect(@watch).to.be.calledTwice
      expect(@watch).to.be.calledWith("/path/to/cypress.json")
      expect(@watch).to.be.calledWith("/path/to/cypress.env.json")

    it "sets onChange event when {changeEvents: true}", (done) ->
      @project.watchSettingsAndStartWebsockets({onSettingsChanged: done})

      ## get the object passed to watchers.watch
      obj = @watch.getCall(0).args[1]

      expect(obj.onChange).to.be.a("function")
      obj.onChange()

    it "does not call watch when {changeEvents: false}", ->
      @project.watchSettingsAndStartWebsockets({onSettingsChanged: undefined})

      expect(@watch).not.to.be.called

    it "does not call onSettingsChanged when generatedProjectIdTimestamp is less than 1 second", ->
      @project.generatedProjectIdTimestamp = timestamp = new Date()

      emit = sinon.spy(@project, "emit")

      stub = sinon.stub()

      @project.watchSettingsAndStartWebsockets({onSettingsChanged: stub})

      ## get the object passed to watchers.watch
      obj = @watch.getCall(0).args[1]
      obj.onChange()

      expect(stub).not.to.be.called

      ## subtract 1 second from our timestamp
      timestamp.setSeconds(timestamp.getSeconds() - 1)

      obj.onChange()

      expect(stub).to.be.calledOnce

  context "#checkSupportFile", ->
    beforeEach ->
      sinon.stub(fs, "pathExists").resolves(true)
      @project = Project("/_test-output/path/to/project")
      @project.server = {onTestFileChange: sinon.spy()}
      sinon.stub(preprocessor, "getFile").resolves()
      @config = {
        projectRoot: "/path/to/root/"
        supportFile: "/path/to/root/foo/bar.js"
      }

    it "does nothing when {supportFile: false}", ->
      ret = @project.checkSupportFile({supportFile: false})

      expect(ret).to.be.undefined

    it "throws when support file does not exist", ->
      fs.pathExists.resolves(false)
      @project.checkSupportFile(@config)
      .catch (e) ->
        expect(e.message).to.include("The support file is missing or invalid.")

  context "#watchPluginsFile", ->
    beforeEach ->
      sinon.stub(fs, "pathExists").resolves(true)
      @project = Project("/_test-output/path/to/project")
      @project.watchers = { watchTree: sinon.spy() }
      sinon.stub(plugins, "init").resolves()
      @config = {
        pluginsFile: "/path/to/plugins-file"
      }

    it "does nothing when {pluginsFile: false}", ->
      @config.pluginsFile = false
      @project.watchPluginsFile(@config).then =>
        expect(@project.watchers.watchTree).not.to.be.called

    it "does nothing if pluginsFile does not exist", ->
      fs.pathExists.resolves(false)
      @project.watchPluginsFile(@config).then =>
        expect(@project.watchers.watchTree).not.to.be.called

    it "watches the pluginsFile", ->
      @project.watchPluginsFile(@config).then =>
        expect(@project.watchers.watchTree).to.be.calledWith(@config.pluginsFile)
        expect(@project.watchers.watchTree.lastCall.args[1]).to.be.an("object")
        expect(@project.watchers.watchTree.lastCall.args[1].onChange).to.be.a("function")

    it "calls plugins.init when file changes", ->
      @project.watchPluginsFile(@config).then =>
        @project.watchers.watchTree.firstCall.args[1].onChange()
        expect(plugins.init).to.be.calledWith(@config)

    it "handles errors from calling plugins.init", (done) ->
      error = {name: "foo", message: "foo"}
      plugins.init.rejects(error)
      @project.watchPluginsFile(@config, {
        onError: (err) ->
          expect(err).to.eql(error)
          done()
      })
      .then =>
        @project.watchers.watchTree.firstCall.args[1].onChange()
      return

  context "#watchSettingsAndStartWebsockets", ->
    beforeEach ->
      @project = Project("/_test-output/path/to/project")
      @project.watchers = {}
      @project.server = sinon.stub({startWebsockets: ->})
      sinon.stub(@project, "watchSettings")
      sinon.stub(Automation, "create").returns("automation")

    it "calls server.startWebsockets with automation + config", ->
      c = {}

      @project.watchSettingsAndStartWebsockets({}, c)

      expect(@project.server.startWebsockets).to.be.calledWith("automation", c)

    it "passes onReloadBrowser callback", ->
      fn = sinon.stub()

      @project.server.startWebsockets.yieldsTo("onReloadBrowser")

      @project.watchSettingsAndStartWebsockets({onReloadBrowser: fn}, {})

      expect(fn).to.be.calledOnce

  context "#getProjectId", ->
    beforeEach ->
      @project         = Project("/_test-output/path/to/project")
      @verifyExistence = sinon.stub(Project.prototype, "verifyExistence").resolves()

    it "calls verifyExistence", ->
      sinon.stub(settings, "read").resolves({projectId: "id-123"})

      @project.getProjectId()
      .then =>
        expect(@verifyExistence).to.be.calledOnce

    it "returns the project id from settings", ->
      sinon.stub(settings, "read").resolves({projectId: "id-123"})

      @project.getProjectId()
      .then (id) ->
        expect(id).to.eq "id-123"

    it "throws NO_PROJECT_ID with the projectRoot when no projectId was found", ->
      sinon.stub(settings, "read").resolves({})

      @project.getProjectId()
      .then (id) ->
        throw new Error("expected to fail, but did not")
      .catch (err) ->
        expect(err.type).to.eq("NO_PROJECT_ID")
        expect(err.message).to.include("/_test-output/path/to/project")

    it "bubbles up Settings.read errors", ->
      err = new Error()
      err.code = "EACCES"

      sinon.stub(settings, "read").rejects(err)

      @project.getProjectId()
      .then (id) ->
        throw new Error("expected to fail, but did not")
      .catch (err) ->
        expect(err.code).to.eq("EACCES")

  context "#writeProjectId", ->
    beforeEach ->
      @project = Project("/_test-output/path/to/project")

      sinon.stub(settings, "write")
        .withArgs(@project.projectRoot, {projectId: "id-123"})
        .resolves({projectId: "id-123"})

    it "calls Settings.write with projectRoot and attrs", ->
      @project.writeProjectId("id-123").then (id) ->
        expect(id).to.eq("id-123")

    it "sets generatedProjectIdTimestamp", ->
      @project.writeProjectId("id-123").then =>
        expect(@project.generatedProjectIdTimestamp).to.be.a("date")

  context "#getSpecUrl", ->
    beforeEach ->
      @project2 = Project(@idsPath)

      settings.write(@idsPath, {port: 2020})

    it "returns fully qualified url when spec exists", ->
      @project2.getSpecUrl("cypress/integration/bar.js")
      .then (str) ->
        expect(str).to.eq("http://localhost:2020/__/#/tests/integration/bar.js")

    it "returns fully qualified url on absolute path to spec", ->
      todosSpec = path.join(@todosPath, "tests/sub/sub_test.coffee")
      @project.getSpecUrl(todosSpec)
      .then (str) ->
        expect(str).to.eq("http://localhost:8888/__/#/tests/integration/sub/sub_test.coffee")

    it "returns __all spec url", ->
      @project.getSpecUrl()
      .then (str) ->
        expect(str).to.eq("http://localhost:8888/__/#/tests/__all")

    it "returns __all spec url with spec is __all", ->
      @project.getSpecUrl('__all')
      .then (str) ->
        expect(str).to.eq("http://localhost:8888/__/#/tests/__all")

  context ".add", ->
    beforeEach ->
      @pristinePath = Fixtures.projectPath("pristine")

    it "inserts path into cache", ->
      Project.add(@pristinePath)
      .then =>
        cache.read()
      .then (json) =>
        expect(json.PROJECTS).to.deep.eq([@pristinePath])

    describe "if project at path has id", ->
      it "returns object containing path and id", ->
        sinon.stub(settings, "read").resolves({projectId: "id-123"})

        Project.add(@pristinePath)
        .then (project) =>
          expect(project.id).to.equal("id-123")
          expect(project.path).to.equal(@pristinePath)

    describe "if project at path does not have id", ->
      it "returns object containing just the path", ->
        sinon.stub(settings, "read").rejects()

        Project.add(@pristinePath)
        .then (project) =>
          expect(project.id).to.be.undefined
          expect(project.path).to.equal(@pristinePath)

  context "#createCiProject", ->
    beforeEach ->
      @project = Project("/_test-output/path/to/project")
      @newProject = { id: "project-id-123" }

      sinon.stub(@project, "writeProjectId").resolves("project-id-123")
      sinon.stub(user, "ensureAuthToken").resolves("auth-token-123")
      sinon.stub(commitInfo, "getRemoteOrigin").resolves("remoteOrigin")
      sinon.stub(api, "createProject")
      .withArgs({foo: "bar"}, "remoteOrigin", "auth-token-123")
      .resolves(@newProject)

    it "calls api.createProject with user session", ->
      @project.createCiProject({foo: "bar"}).then ->
        expect(api.createProject).to.be.calledWith({foo: "bar"}, "remoteOrigin", "auth-token-123")

    it "calls writeProjectId with id", ->
      @project.createCiProject({foo: "bar"}).then =>
        expect(@project.writeProjectId).to.be.calledWith("project-id-123")

    it "returns project id", ->
      @project.createCiProject({foo: "bar"}).then (projectId) =>
        expect(projectId).to.eql(@newProject)

  context "#getRecordKeys", ->
    beforeEach ->
      @recordKeys = []
      @project = Project(@pristinePath)
      sinon.stub(settings, "read").resolves({projectId: "id-123"})
      sinon.stub(user, "ensureAuthToken").resolves("auth-token-123")
      sinon.stub(api, "getProjectRecordKeys").resolves(@recordKeys)

    it "calls api.getProjectRecordKeys with project id + session", ->
      @project.getRecordKeys().then ->
        expect(api.getProjectRecordKeys).to.be.calledWith("id-123", "auth-token-123")

    it "returns ci keys", ->
      @project.getRecordKeys().then (recordKeys) =>
        expect(recordKeys).to.equal(@recordKeys)

  context "#requestAccess", ->
    beforeEach ->
      @project = Project(@pristinePath)
      sinon.stub(user, "ensureAuthToken").resolves("auth-token-123")
      sinon.stub(api, "requestAccess").resolves("response")

    it "calls api.requestAccess with project id + auth token", ->
      @project.requestAccess("project-id-123").then ->
        expect(api.requestAccess).to.be.calledWith("project-id-123", "auth-token-123")

    it "returns response", ->
      @project.requestAccess("project-id-123").then (response) =>
        expect(response).to.equal("response")

  context ".remove", ->
    beforeEach ->
      sinon.stub(cache, "removeProject").resolves()

    it "calls cache.removeProject with path", ->
      Project.remove("/_test-output/path/to/project").then ->
        expect(cache.removeProject).to.be.calledWith("/_test-output/path/to/project")

  context ".id", ->
    it "returns project id", ->
      Project.id(@todosPath).then (id) =>
        expect(id).to.eq(@projectId)

  context ".getOrgs", ->
    beforeEach ->
      sinon.stub(user, "ensureAuthToken").resolves("auth-token-123")
      sinon.stub(api, "getOrgs").resolves([])

    it "calls api.getOrgs", ->
      Project.getOrgs().then (orgs) ->
        expect(orgs).to.deep.eq([])
        expect(api.getOrgs).to.be.calledOnce
        expect(api.getOrgs).to.be.calledWith("auth-token-123")

  context ".paths", ->
    beforeEach ->
      sinon.stub(cache, "getProjectRoots").resolves([])

    it "calls cache.getProjectRoots", ->
      Project.paths().then (ret) ->
        expect(ret).to.deep.eq([])
        expect(cache.getProjectRoots).to.be.calledOnce

  context ".getPathsAndIds", ->
    beforeEach ->
      sinon.stub(cache, "getProjectRoots").resolves([
        "/path/to/first"
        "/path/to/second"
      ])
      sinon.stub(settings, "id").resolves("id-123")

    it "returns array of objects with paths and ids", ->
      Project.getPathsAndIds().then (pathsAndIds) ->
        expect(pathsAndIds).to.eql([
          {
            path: "/path/to/first"
            id: "id-123"
          }
          {
            path: "/path/to/second"
            id: "id-123"
          }
        ])

  context ".getProjectStatuses", ->
    beforeEach ->
      sinon.stub(user, "ensureAuthToken").resolves("auth-token-123")

    it "gets projects from api", ->
      sinon.stub(api, "getProjects").resolves([])

      Project.getProjectStatuses([])
      .then ->
        expect(api.getProjects).to.have.been.calledWith("auth-token-123")

    it "returns array of projects", ->
      sinon.stub(api, "getProjects").resolves([])

      Project.getProjectStatuses([])
      .then (projectsWithStatuses) =>
        expect(projectsWithStatuses).to.eql([])

    it "returns same number as client projects, even if there are less api projects", ->
      sinon.stub(api, "getProjects").resolves([])

      Project.getProjectStatuses([{}])
      .then (projectsWithStatuses) =>
        expect(projectsWithStatuses.length).to.eql(1)

    it "returns same number as client projects, even if there are more api projects", ->
      sinon.stub(api, "getProjects").resolves([{}, {}])

      Project.getProjectStatuses([{}])
      .then (projectsWithStatuses) =>
        expect(projectsWithStatuses.length).to.eql(1)

    it "merges in details of matching projects", ->
      sinon.stub(api, "getProjects").resolves([
        { id: "id-123", lastBuildStatus: "passing" }
      ])

      Project.getProjectStatuses([{ id: "id-123", path: "/_test-output/path/to/project" }])
      .then (projectsWithStatuses) =>
        expect(projectsWithStatuses[0]).to.eql({
          id: "id-123"
          path: "/_test-output/path/to/project"
          lastBuildStatus: "passing"
          state: "VALID"
        })

    it "returns client project when it has no id", ->
      sinon.stub(api, "getProjects").resolves([])

      Project.getProjectStatuses([{ path: "/_test-output/path/to/project" }])
      .then (projectsWithStatuses) =>
        expect(projectsWithStatuses[0]).to.eql({
          path: "/_test-output/path/to/project"
          state: "VALID"
        })

    describe "when client project has id and there is no matching user project", ->
      beforeEach ->
        sinon.stub(api, "getProjects").resolves([])

      it "marks project as invalid if api 404s", ->
        sinon.stub(api, "getProject").rejects({name: "", message: "", statusCode: 404})

        Project.getProjectStatuses([{ id: "id-123", path: "/_test-output/path/to/project" }])
        .then (projectsWithStatuses) =>
          expect(projectsWithStatuses[0]).to.eql({
            id: "id-123"
            path: "/_test-output/path/to/project"
            state: "INVALID"
          })

      it "marks project as unauthorized if api 403s", ->
        sinon.stub(api, "getProject").rejects({name: "", message: "", statusCode: 403})

        Project.getProjectStatuses([{ id: "id-123", path: "/_test-output/path/to/project" }])
        .then (projectsWithStatuses) =>
          expect(projectsWithStatuses[0]).to.eql({
            id: "id-123"
            path: "/_test-output/path/to/project"
            state: "UNAUTHORIZED"
          })

      it "merges in project details and marks valid if somehow project exists and is authorized", ->
        sinon.stub(api, "getProject").resolves({ id: "id-123", lastBuildStatus: "passing" })

        Project.getProjectStatuses([{ id: "id-123", path: "/_test-output/path/to/project" }])
        .then (projectsWithStatuses) =>
          expect(projectsWithStatuses[0]).to.eql({
            id: "id-123"
            path: "/_test-output/path/to/project"
            lastBuildStatus: "passing"
            state: "VALID"
          })

      it "throws error if not accounted for", ->
        error = {name: "", message: ""}
        sinon.stub(api, "getProject").rejects(error)

        Project.getProjectStatuses([{ id: "id-123", path: "/_test-output/path/to/project" }])
        .then =>
          throw new Error("should have caught error but did not")
        .catch (err) ->
          expect(err).to.equal(error)

  context ".getProjectStatus", ->
    beforeEach ->
      @clientProject = {
        id: "id-123",
        path: "/_test-output/path/to/project"
      }
      sinon.stub(user, "ensureAuthToken").resolves("auth-token-123")

    it "gets project from api", ->
      sinon.stub(api, "getProject").resolves([])

      Project.getProjectStatus(@clientProject)
      .then ->
        expect(api.getProject).to.have.been.calledWith("id-123", "auth-token-123")

    it "returns project merged with details", ->
      sinon.stub(api, "getProject").resolves({
        lastBuildStatus: "passing"
      })

      Project.getProjectStatus(@clientProject)
      .then (project) =>
        expect(project).to.eql({
          id: "id-123"
          path: "/_test-output/path/to/project"
          lastBuildStatus: "passing"
          state: "VALID"
        })

    it "returns project, marked as valid, if it does not have an id, without querying api", ->
      sinon.stub(api, "getProject")

      @clientProject.id = undefined
      Project.getProjectStatus(@clientProject)
      .then (project) =>
        expect(project).to.eql({
          id: undefined
          path: "/_test-output/path/to/project"
          state: "VALID"
        })
        expect(api.getProject).not.to.be.called

    it "marks project as invalid if api 404s", ->
      sinon.stub(api, "getProject").rejects({name: "", message: "", statusCode: 404})

      Project.getProjectStatus(@clientProject)
      .then (project) =>
        expect(project).to.eql({
          id: "id-123"
          path: "/_test-output/path/to/project"
          state: "INVALID"
        })

    it "marks project as unauthorized if api 403s", ->
      sinon.stub(api, "getProject").rejects({name: "", message: "", statusCode: 403})

      Project.getProjectStatus(@clientProject)
      .then (project) =>
        expect(project).to.eql({
          id: "id-123"
          path: "/_test-output/path/to/project"
          state: "UNAUTHORIZED"
        })

    it "throws error if not accounted for", ->
      error = {name: "", message: ""}
      sinon.stub(api, "getProject").rejects(error)

      Project.getProjectStatus(@clientProject)
      .then =>
        throw new Error("should have caught error but did not")
      .catch (err) ->
        expect(err).to.equal(error)

  context ".getSecretKeyByPath", ->
    beforeEach ->
      sinon.stub(user, "ensureAuthToken").resolves("auth-token-123")

    it "calls api.getProjectToken with id + session", ->
      sinon.stub(api, "getProjectToken")
        .withArgs(@projectId, "auth-token-123")
        .resolves("key-123")

      Project.getSecretKeyByPath(@todosPath).then (key) ->
        expect(key).to.eq("key-123")

    it "throws CANNOT_FETCH_PROJECT_TOKEN on error", ->
      sinon.stub(api, "getProjectToken")
        .withArgs(@projectId, "auth-token-123")
        .rejects(new Error())

      Project.getSecretKeyByPath(@todosPath)
      .then ->
        throw new Error("should have caught error but did not")
      .catch (err) ->
        expect(err.type).to.eq("CANNOT_FETCH_PROJECT_TOKEN")

  context ".generateSecretKeyByPath", ->
    beforeEach ->
      sinon.stub(user, "ensureAuthToken").resolves("auth-token-123")

    it "calls api.updateProjectToken with id + session", ->
      sinon.stub(api, "updateProjectToken")
        .withArgs(@projectId, "auth-token-123")
        .resolves("new-key-123")

      Project.generateSecretKeyByPath(@todosPath).then (key) ->
        expect(key).to.eq("new-key-123")

    it "throws CANNOT_CREATE_PROJECT_TOKEN on error", ->
      sinon.stub(api, "updateProjectToken")
        .withArgs(@projectId, "auth-token-123")
        .rejects(new Error())

      Project.generateSecretKeyByPath(@todosPath)
      .then ->
        throw new Error("should have caught error but did not")
      .catch (err) ->
        expect(err.type).to.eq("CANNOT_CREATE_PROJECT_TOKEN")
