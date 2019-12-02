/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../spec_helper");

const path         = require("path");
const Promise      = require("bluebird");
const commitInfo   = require("@cypress/commit-info");
const Fixtures     = require("../support/helpers/fixtures");
const api          = require(`${root}lib/api`);
const user         = require(`${root}lib/user`);
const cache        = require(`${root}lib/cache`);
const errors       = require(`${root}lib/errors`);
const config       = require(`${root}lib/config`);
const scaffold     = require(`${root}lib/scaffold`);
const Server       = require(`${root}lib/server`);
const Project      = require(`${root}lib/project`);
const Automation   = require(`${root}lib/automation`);
const savedState   = require(`${root}lib/saved_state`);
const preprocessor = require(`${root}lib/plugins/preprocessor`);
const plugins      = require(`${root}lib/plugins`);
const fs           = require(`${root}lib/util/fs`);
const settings     = require(`${root}lib/util/settings`);

describe("lib/project", function() {
  beforeEach(function() {
    Fixtures.scaffold();

    this.todosPath    = Fixtures.projectPath("todos");
    this.idsPath      = Fixtures.projectPath("ids");
    this.pristinePath = Fixtures.projectPath("pristine");

    return settings.read(this.todosPath).then((obj = {}) => {
      ({projectId: this.projectId} = obj);

      return config.set({projectName: "project", projectRoot: "/foo/bar"})
      .then(config1 => {
        this.config = config1;
        return this.project = Project(this.todosPath);
      });
    });
  });

  afterEach(function() {
    Fixtures.remove();
    return (this.project != null ? this.project.close() : undefined);
  });

  it("requires a projectRoot", function() {
    const fn = () => Project();
    return expect(fn).to.throw("Instantiating lib/project requires a projectRoot!");
  });

  it("always resolves the projectRoot to be absolute", function() {
    const p = Project("../foo/bar");
    expect(p.projectRoot).not.to.eq("../foo/bar");
    return expect(p.projectRoot).to.eq(path.resolve("../foo/bar"));
  });

  context("#saveState", function() {
    beforeEach(function() {
      const integrationFolder = "the/save/state/test";
      sinon.stub(config, "get").withArgs(this.todosPath).resolves({ integrationFolder });
      sinon.stub(this.project, "determineIsNewProject").withArgs(integrationFolder).resolves(false);
      this.project.cfg = { integrationFolder };
      return savedState(this.project.projectRoot)
      .then(state => state.remove());
    });

    afterEach(function() {
      return savedState(this.project.projectRoot)
      .then(state => state.remove());
    });

    it("saves state without modification", function() {
      return this.project.saveState()
      .then(state => expect(state).to.deep.eq({}));
    });

    it("adds property", function() {
      return this.project.saveState()
      .then(() => this.project.saveState({ foo: 42 }))
      .then(state => expect(state).to.deep.eq({ foo: 42 }));
    });

    it("adds second property", function() {
      return this.project.saveState()
      .then(() => this.project.saveState({ foo: 42 }))
      .then(() => this.project.saveState({ bar: true }))
      .then(state => expect(state).to.deep.eq({ foo: 42, bar: true }));
    });

    return it("modifes property", function() {
      return this.project.saveState()
      .then(() => this.project.saveState({ foo: 42 }))
      .then(() => this.project.saveState({ foo: 'modified' }))
      .then(state => expect(state).to.deep.eq({ foo: 'modified' }));
    });
  });

  context("#getConfig", function() {
    const integrationFolder = "foo/bar/baz";
    beforeEach(function() {
      sinon.stub(config, "get").withArgs(this.todosPath, {foo: "bar"}).resolves({ baz: "quux", integrationFolder });
      return sinon.stub(this.project, "determineIsNewProject").withArgs(integrationFolder).resolves(false);
    });

    it("calls config.get with projectRoot + options + saved state", function() {
      return savedState(this.todosPath)
      .then(state => {
        sinon.stub(state, "get").resolves({ reporterWidth: 225 });
        return this.project.getConfig({foo: "bar"})
        .then(cfg =>
          expect(cfg).to.deep.eq({
            integrationFolder,
            isNewProject: false,
            baz: "quux",
            state: {
              reporterWidth: 225
            }
          })
        );
      });
    });

    it("resolves if cfg is already set", function() {
      this.project.cfg = {
        integrationFolder,
        foo: "bar"
      };

      return this.project.getConfig()
      .then(cfg =>
        expect(cfg).to.deep.eq({
          integrationFolder,
          foo: "bar"
        })
      );
    });

    it("sets cfg.isNewProject to true when state.showedOnBoardingModal is true", function() {
      return savedState(this.todosPath)
      .then(state => {
        sinon.stub(state, "get").resolves({ showedOnBoardingModal: true });

        return this.project.getConfig({foo: "bar"})
        .then(cfg =>
          expect(cfg).to.deep.eq({
            integrationFolder,
            isNewProject: false,
            baz: "quux",
            state: {
              showedOnBoardingModal: true
            }
          })
        );
      });
    });

    return it("does not set cfg.isNewProject when cfg.isTextTerminal", function() {
      const cfg = { isTextTerminal: true };

      config.get.resolves(cfg);

      sinon.stub(this.project, "_setSavedState").resolves(cfg);

      return this.project.getConfig({foo: "bar"})
      .then(cfg => expect(cfg).not.to.have.property("isNewProject"));
    });
  });

  context("#open", function() {
    beforeEach(function() {
      sinon.stub(this.project, "watchSettingsAndStartWebsockets").resolves();
      sinon.stub(this.project, "checkSupportFile").resolves();
      sinon.stub(this.project, "scaffold").resolves();
      sinon.stub(this.project, "getConfig").resolves(this.config);
      sinon.stub(Server.prototype, "open").resolves([]);
      sinon.stub(Server.prototype, "reset");
      sinon.stub(config, "updateWithPluginValues").returns(this.config);
      sinon.stub(scaffold, "plugins").resolves();
      return sinon.stub(plugins, "init").resolves();
    });

    it("calls #watchSettingsAndStartWebsockets with options + config", function() {
      const opts = {changeEvents: false, onAutomationRequest() {}};
      this.project.cfg = {};
      return this.project.open(opts).then(() => {
        return expect(this.project.watchSettingsAndStartWebsockets).to.be.calledWith(opts, this.project.cfg);
      });
    });

    it("calls #scaffold with server config promise", function() {
      return this.project.open().then(() => {
        return expect(this.project.scaffold).to.be.calledWith(this.config);
      });
    });

    it("calls #checkSupportFile with server config when scaffolding is finished", function() {
      return this.project.open().then(() => {
        return expect(this.project.checkSupportFile).to.be.calledWith(this.config);
      });
    });

    it("calls #getConfig options", function() {
      const opts = {};
      return this.project.open(opts).then(() => {
        return expect(this.project.getConfig).to.be.calledWith(opts);
      });
    });

    it("initializes the plugins", function() {
      return this.project.open({}).then(() => {
        return expect(plugins.init).to.be.called;
      });
    });

    it("calls support.plugins with pluginsFile directory", function() {
      return this.project.open({}).then(() => {
        return expect(scaffold.plugins).to.be.calledWith(path.dirname(this.config.pluginsFile));
      });
    });

    it("calls options.onError with plugins error when there is a plugins error", function() {
      const onError = sinon.spy();
      const err = {
        name: "plugin error name",
        message: "plugin error message"
      };
      return this.project.open({ onError }).then(() => {
        const pluginsOnError = plugins.init.lastCall.args[1].onError;
        expect(pluginsOnError).to.be.a("function");
        pluginsOnError(err);
        return expect(onError).to.be.calledWith(err);
      });
    });

    it("updates config.state when saved state changes", function() {
      sinon.spy(this.project, "saveState");

      const options = {};

      return this.project.open(options)
      .then(() => {
        return options.onSavedStateChanged({ autoScrollingEnabled: false });
    }).then(() => {
        return this.project.getConfig();
      }).then(config => {
        expect(this.project.saveState).to.be.calledWith({ autoScrollingEnabled: false});
        return expect(config.state).to.eql({ autoScrollingEnabled: false });
      });
    });

    // TODO: skip this for now
    it.skip("watches cypress.json", function() {
      return this.server.open().bind(this).then(() => expect(Watchers.prototype.watch).to.be.calledWith("/Users/brian/app/cypress.json"));
    });

    // TODO: skip this for now
    it.skip("passes watchers to Socket.startListening", function() {
      const options = {};

      return this.server.open(options).then(function() {
        const { startListening } = Socket.prototype;
        expect(startListening.getCall(0).args[0]).to.be.instanceof(Watchers);
        return expect(startListening.getCall(0).args[1]).to.eq(options);
      });
    });
    return null;
  });

  context("#close", function() {
    beforeEach(function() {
      this.project = Project("/_test-output/path/to/project");

      sinon.stub(this.project, "getConfig").resolves(this.config);
      return sinon.stub(user, "ensureAuthToken").resolves("auth-token-123");
    });

    it("closes server", function() {
      this.project.server = sinon.stub({close() {}});

      return this.project.close().then(() => {
        return expect(this.project.server.close).to.be.calledOnce;
      });
    });

    it("closes watchers", function() {
      this.project.watchers = sinon.stub({close() {}});

      return this.project.close().then(() => {
        return expect(this.project.watchers.close).to.be.calledOnce;
      });
    });

    return it("can close when server + watchers arent open", function() {
      return this.project.close();
    });
  });

  context("#reset", function() {
    beforeEach(function() {
      this.project = Project(this.pristinePath);
      this.project.automation = { reset: sinon.stub() };
      return this.project.server = { reset: sinon.stub() };});

    return it("resets server + automation", function() {
      return this.project.reset()
      .then(() => {
        expect(this.project.automation.reset).to.be.calledOnce;
        return expect(this.project.server.reset).to.be.calledOnce;
      });
    });
  });

  context("#getRuns", function() {
    beforeEach(function() {
      this.project = Project(this.todosPath);
      sinon.stub(settings, "read").resolves({projectId: "id-123"});
      sinon.stub(api, "getProjectRuns").resolves('runs');
      return sinon.stub(user, "ensureAuthToken").resolves("auth-token-123");
    });

    return it("calls api.getProjectRuns with project id + session", function() {
      return this.project.getRuns().then(function(runs) {
        expect(api.getProjectRuns).to.be.calledWith("id-123", "auth-token-123");
        return expect(runs).to.equal("runs");
      });
    });
  });

  context("#scaffold", function() {
    beforeEach(function() {
      this.project = Project("/_test-output/path/to/project");
      sinon.stub(scaffold, "integration").resolves();
      sinon.stub(scaffold, "fixture").resolves();
      sinon.stub(scaffold, "support").resolves();
      sinon.stub(scaffold, "plugins").resolves();

      return this.obj = {projectRoot: "pr", fixturesFolder: "ff", integrationFolder: "if", supportFolder: "sf", pluginsFile: "pf/index.js"};});

    it("calls scaffold.integration with integrationFolder", function() {
      return this.project.scaffold(this.obj).then(() => {
        return expect(scaffold.integration).to.be.calledWith(this.obj.integrationFolder);
      });
    });

    it("calls fixture.scaffold with fixturesFolder", function() {
      return this.project.scaffold(this.obj).then(() => {
        return expect(scaffold.fixture).to.be.calledWith(this.obj.fixturesFolder);
      });
    });

    it("calls support.scaffold with supportFolder", function() {
      return this.project.scaffold(this.obj).then(() => {
        return expect(scaffold.support).to.be.calledWith(this.obj.supportFolder);
      });
    });

    return it("does not call support.plugins if config.pluginsFile is falsey", function() {
      this.obj.pluginsFile = false;
      return this.project.scaffold(this.obj).then(() => {
        return expect(scaffold.plugins).not.to.be.called;
      });
    });
  });

  context("#watchSettings", function() {
    beforeEach(function() {
      this.project = Project("/_test-output/path/to/project");
      this.project.server = {startWebsockets() {}};
      sinon.stub(settings, "pathToConfigFile").returns("/path/to/cypress.json");
      sinon.stub(settings, "pathToCypressEnvJson").returns("/path/to/cypress.env.json");
      return this.watch = sinon.stub(this.project.watchers, "watch");
    });

    it("watches cypress.json and cypress.env.json", function() {
      this.project.watchSettingsAndStartWebsockets({onSettingsChanged() {}});
      expect(this.watch).to.be.calledTwice;
      expect(this.watch).to.be.calledWith("/path/to/cypress.json");
      return expect(this.watch).to.be.calledWith("/path/to/cypress.env.json");
    });

    it("sets onChange event when {changeEvents: true}", function(done) {
      this.project.watchSettingsAndStartWebsockets({onSettingsChanged() { return done(); }});

      //# get the object passed to watchers.watch
      const obj = this.watch.getCall(0).args[1];

      expect(obj.onChange).to.be.a("function");
      return obj.onChange();
    });

    it("does not call watch when {changeEvents: false}", function() {
      this.project.watchSettingsAndStartWebsockets({onSettingsChanged: undefined});

      return expect(this.watch).not.to.be.called;
    });

    return it("does not call onSettingsChanged when generatedProjectIdTimestamp is less than 1 second", function() {
      let timestamp;
      this.project.generatedProjectIdTimestamp = (timestamp = new Date());

      const emit = sinon.spy(this.project, "emit");

      const stub = sinon.stub();

      this.project.watchSettingsAndStartWebsockets({onSettingsChanged: stub});

      //# get the object passed to watchers.watch
      const obj = this.watch.getCall(0).args[1];
      obj.onChange();

      expect(stub).not.to.be.called;

      //# subtract 1 second from our timestamp
      timestamp.setSeconds(timestamp.getSeconds() - 1);

      obj.onChange();

      return expect(stub).to.be.calledOnce;
    });
  });

  context("#checkSupportFile", function() {
    beforeEach(function() {
      sinon.stub(fs, "pathExists").resolves(true);
      this.project = Project("/_test-output/path/to/project");
      this.project.server = {onTestFileChange: sinon.spy()};
      sinon.stub(preprocessor, "getFile").resolves();
      return this.config = {
        projectRoot: "/path/to/root/",
        supportFile: "/path/to/root/foo/bar.js"
      };});

    it("does nothing when {supportFile: false}", function() {
      const ret = this.project.checkSupportFile({supportFile: false});

      return expect(ret).to.be.undefined;
    });

    return it("throws when support file does not exist", function() {
      fs.pathExists.resolves(false);
      return this.project.checkSupportFile(this.config)
      .catch(e => expect(e.message).to.include("The support file is missing or invalid."));
    });
  });

  context("#watchPluginsFile", function() {
    beforeEach(function() {
      sinon.stub(fs, "pathExists").resolves(true);
      this.project = Project("/_test-output/path/to/project");
      this.project.watchers = { watchTree: sinon.spy() };
      sinon.stub(plugins, "init").resolves();
      return this.config = {
        pluginsFile: "/path/to/plugins-file"
      };});

    it("does nothing when {pluginsFile: false}", function() {
      this.config.pluginsFile = false;
      return this.project.watchPluginsFile(this.config, {}).then(() => {
        return expect(this.project.watchers.watchTree).not.to.be.called;
      });
    });

    it("does nothing if pluginsFile does not exist", function() {
      fs.pathExists.resolves(false);
      return this.project.watchPluginsFile(this.config, {}).then(() => {
        return expect(this.project.watchers.watchTree).not.to.be.called;
      });
    });

    it("does nothing if in run mode", function() {
      return this.project.watchPluginsFile(this.config, {
        isTextTerminal: true
      }).then(() => {
        return expect(this.project.watchers.watchTree).not.to.be.called;
      });
    });

    it("watches the pluginsFile", function() {
      return this.project.watchPluginsFile(this.config, {}).then(() => {
        expect(this.project.watchers.watchTree).to.be.calledWith(this.config.pluginsFile);
        expect(this.project.watchers.watchTree.lastCall.args[1]).to.be.an("object");
        return expect(this.project.watchers.watchTree.lastCall.args[1].onChange).to.be.a("function");
      });
    });

    it("calls plugins.init when file changes", function() {
      return this.project.watchPluginsFile(this.config, {}).then(() => {
        this.project.watchers.watchTree.firstCall.args[1].onChange();
        return expect(plugins.init).to.be.calledWith(this.config);
      });
    });

    return it("handles errors from calling plugins.init", function(done) {
      const error = {name: "foo", message: "foo"};
      plugins.init.rejects(error);
      this.project.watchPluginsFile(this.config, {
        onError(err) {
          expect(err).to.eql(error);
          return done();
        }
      })
      .then(() => {
        return this.project.watchers.watchTree.firstCall.args[1].onChange();
      });
    });
  });

  context("#watchSettingsAndStartWebsockets", function() {
    beforeEach(function() {
      this.project = Project("/_test-output/path/to/project");
      this.project.watchers = {};
      this.project.server = sinon.stub({startWebsockets() {}});
      sinon.stub(this.project, "watchSettings");
      return sinon.stub(Automation, "create").returns("automation");
    });

    it("calls server.startWebsockets with automation + config", function() {
      const c = {};

      this.project.watchSettingsAndStartWebsockets({}, c);

      return expect(this.project.server.startWebsockets).to.be.calledWith("automation", c);
    });

    return it("passes onReloadBrowser callback", function() {
      const fn = sinon.stub();

      this.project.server.startWebsockets.yieldsTo("onReloadBrowser");

      this.project.watchSettingsAndStartWebsockets({onReloadBrowser: fn}, {});

      return expect(fn).to.be.calledOnce;
    });
  });

  context("#getProjectId", function() {
    beforeEach(function() {
      this.project         = Project("/_test-output/path/to/project");
      return this.verifyExistence = sinon.stub(Project.prototype, "verifyExistence").resolves();
    });

    it("calls verifyExistence", function() {
      sinon.stub(settings, "read").resolves({projectId: "id-123"});

      return this.project.getProjectId()
      .then(() => {
        return expect(this.verifyExistence).to.be.calledOnce;
      });
    });

    it("returns the project id from settings", function() {
      sinon.stub(settings, "read").resolves({projectId: "id-123"});

      return this.project.getProjectId()
      .then(id => expect(id).to.eq("id-123"));
    });

    it("throws NO_PROJECT_ID with the projectRoot when no projectId was found", function() {
      sinon.stub(settings, "read").resolves({});

      return this.project.getProjectId()
      .then(function(id) {
        throw new Error("expected to fail, but did not");}).catch(function(err) {
        expect(err.type).to.eq("NO_PROJECT_ID");
        return expect(err.message).to.include("/_test-output/path/to/project");
      });
    });

    return it("bubbles up Settings.read errors", function() {
      const err = new Error();
      err.code = "EACCES";

      sinon.stub(settings, "read").rejects(err);

      return this.project.getProjectId()
      .then(function(id) {
        throw new Error("expected to fail, but did not");}).catch(err => expect(err.code).to.eq("EACCES"));
    });
  });

  context("#writeProjectId", function() {
    beforeEach(function() {
      this.project = Project("/_test-output/path/to/project");

      return sinon.stub(settings, "write")
        .withArgs(this.project.projectRoot, {projectId: "id-123"})
        .resolves({projectId: "id-123"});
    });

    it("calls Settings.write with projectRoot and attrs", function() {
      return this.project.writeProjectId("id-123").then(id => expect(id).to.eq("id-123"));
    });

    return it("sets generatedProjectIdTimestamp", function() {
      return this.project.writeProjectId("id-123").then(() => {
        return expect(this.project.generatedProjectIdTimestamp).to.be.a("date");
      });
    });
  });

  context("#getSpecUrl", function() {
    beforeEach(function() {
      this.project2 = Project(this.idsPath);

      return settings.write(this.idsPath, {port: 2020});
    });

    it("returns fully qualified url when spec exists", function() {
      return this.project2.getSpecUrl("cypress/integration/bar.js")
      .then(str => expect(str).to.eq("http://localhost:2020/__/#/tests/integration/bar.js"));
    });

    it("returns fully qualified url on absolute path to spec", function() {
      const todosSpec = path.join(this.todosPath, "tests/sub/sub_test.coffee");
      return this.project.getSpecUrl(todosSpec)
      .then(str => expect(str).to.eq("http://localhost:8888/__/#/tests/integration/sub/sub_test.coffee"));
    });

    it("returns __all spec url", function() {
      return this.project.getSpecUrl()
      .then(str => expect(str).to.eq("http://localhost:8888/__/#/tests/__all"));
    });

    return it("returns __all spec url with spec is __all", function() {
      return this.project.getSpecUrl('__all')
      .then(str => expect(str).to.eq("http://localhost:8888/__/#/tests/__all"));
    });
  });

  context(".add", function() {
    beforeEach(function() {
      return this.pristinePath = Fixtures.projectPath("pristine");
    });

    it("inserts path into cache", function() {
      return Project.add(this.pristinePath, {})
      .then(() => {
        return cache.read();
    }).then(json => {
        return expect(json.PROJECTS).to.deep.eq([this.pristinePath]);
      });
    });

    describe("if project at path has id", () =>
      it("returns object containing path and id", function() {
        sinon.stub(settings, "read").resolves({projectId: "id-123"});

        return Project.add(this.pristinePath, {})
        .then(project => {
          expect(project.id).to.equal("id-123");
          return expect(project.path).to.equal(this.pristinePath);
        });
      })
    );

    describe("if project at path does not have id", () =>
      it("returns object containing just the path", function() {
        sinon.stub(settings, "read").rejects();

        return Project.add(this.pristinePath, {})
        .then(project => {
          expect(project.id).to.be.undefined;
          return expect(project.path).to.equal(this.pristinePath);
        });
      })
    );

    return describe("if configFile is non-default", () =>
      it("doesn't cache anything and returns object containing just the path", function() {
        return Project.add(this.pristinePath, { configFile: false })
        .then(project => {
          expect(project.id).to.be.undefined;
          expect(project.path).to.equal(this.pristinePath);
          return cache.read();
      }).then(json => {
          return expect(json.PROJECTS).to.deep.eq([]);
        });
      })
    );
  });

  context("#createCiProject", function() {
    beforeEach(function() {
      this.project = Project("/_test-output/path/to/project");
      this.newProject = { id: "project-id-123" };

      sinon.stub(this.project, "writeProjectId").resolves("project-id-123");
      sinon.stub(user, "ensureAuthToken").resolves("auth-token-123");
      sinon.stub(commitInfo, "getRemoteOrigin").resolves("remoteOrigin");
      return sinon.stub(api, "createProject")
      .withArgs({foo: "bar"}, "remoteOrigin", "auth-token-123")
      .resolves(this.newProject);
    });

    it("calls api.createProject with user session", function() {
      return this.project.createCiProject({foo: "bar"}).then(() => expect(api.createProject).to.be.calledWith({foo: "bar"}, "remoteOrigin", "auth-token-123"));
    });

    it("calls writeProjectId with id", function() {
      return this.project.createCiProject({foo: "bar"}).then(() => {
        return expect(this.project.writeProjectId).to.be.calledWith("project-id-123");
      });
    });

    return it("returns project id", function() {
      return this.project.createCiProject({foo: "bar"}).then(projectId => {
        return expect(projectId).to.eql(this.newProject);
      });
    });
  });

  context("#getRecordKeys", function() {
    beforeEach(function() {
      this.recordKeys = [];
      this.project = Project(this.pristinePath);
      sinon.stub(settings, "read").resolves({projectId: "id-123"});
      sinon.stub(user, "ensureAuthToken").resolves("auth-token-123");
      return sinon.stub(api, "getProjectRecordKeys").resolves(this.recordKeys);
    });

    it("calls api.getProjectRecordKeys with project id + session", function() {
      return this.project.getRecordKeys().then(() => expect(api.getProjectRecordKeys).to.be.calledWith("id-123", "auth-token-123"));
    });

    return it("returns ci keys", function() {
      return this.project.getRecordKeys().then(recordKeys => {
        return expect(recordKeys).to.equal(this.recordKeys);
      });
    });
  });

  context("#requestAccess", function() {
    beforeEach(function() {
      this.project = Project(this.pristinePath);
      sinon.stub(user, "ensureAuthToken").resolves("auth-token-123");
      return sinon.stub(api, "requestAccess").resolves("response");
    });

    it("calls api.requestAccess with project id + auth token", function() {
      return this.project.requestAccess("project-id-123").then(() => expect(api.requestAccess).to.be.calledWith("project-id-123", "auth-token-123"));
    });

    return it("returns response", function() {
      return this.project.requestAccess("project-id-123").then(response => {
        return expect(response).to.equal("response");
      });
    });
  });

  context(".remove", function() {
    beforeEach(() => sinon.stub(cache, "removeProject").resolves());

    return it("calls cache.removeProject with path", () =>
      Project.remove("/_test-output/path/to/project").then(() => expect(cache.removeProject).to.be.calledWith("/_test-output/path/to/project"))
    );
  });

  context(".id", () =>
    it("returns project id", function() {
      return Project.id(this.todosPath).then(id => {
        return expect(id).to.eq(this.projectId);
      });
    })
  );

  context(".getOrgs", function() {
    beforeEach(function() {
      sinon.stub(user, "ensureAuthToken").resolves("auth-token-123");
      return sinon.stub(api, "getOrgs").resolves([]);
    });

    return it("calls api.getOrgs", () =>
      Project.getOrgs().then(function(orgs) {
        expect(orgs).to.deep.eq([]);
        expect(api.getOrgs).to.be.calledOnce;
        return expect(api.getOrgs).to.be.calledWith("auth-token-123");
      })
    );
  });

  context(".paths", function() {
    beforeEach(() => sinon.stub(cache, "getProjectRoots").resolves([]));

    return it("calls cache.getProjectRoots", () =>
      Project.paths().then(function(ret) {
        expect(ret).to.deep.eq([]);
        return expect(cache.getProjectRoots).to.be.calledOnce;
      })
    );
  });

  context(".getPathsAndIds", function() {
    beforeEach(function() {
      sinon.stub(cache, "getProjectRoots").resolves([
        "/path/to/first",
        "/path/to/second"
      ]);
      return sinon.stub(settings, "id").resolves("id-123");
    });

    return it("returns array of objects with paths and ids", () =>
      Project.getPathsAndIds().then(pathsAndIds =>
        expect(pathsAndIds).to.eql([
          {
            path: "/path/to/first",
            id: "id-123"
          },
          {
            path: "/path/to/second",
            id: "id-123"
          }
        ])
      )
    );
  });

  context(".getProjectStatuses", function() {
    beforeEach(() => sinon.stub(user, "ensureAuthToken").resolves("auth-token-123"));

    it("gets projects from api", function() {
      sinon.stub(api, "getProjects").resolves([]);

      return Project.getProjectStatuses([])
      .then(() => expect(api.getProjects).to.have.been.calledWith("auth-token-123"));
    });

    it("returns array of projects", function() {
      sinon.stub(api, "getProjects").resolves([]);

      return Project.getProjectStatuses([])
      .then(projectsWithStatuses => {
        return expect(projectsWithStatuses).to.eql([]);
      });
    });

    it("returns same number as client projects, even if there are less api projects", function() {
      sinon.stub(api, "getProjects").resolves([]);

      return Project.getProjectStatuses([{}])
      .then(projectsWithStatuses => {
        return expect(projectsWithStatuses.length).to.eql(1);
      });
    });

    it("returns same number as client projects, even if there are more api projects", function() {
      sinon.stub(api, "getProjects").resolves([{}, {}]);

      return Project.getProjectStatuses([{}])
      .then(projectsWithStatuses => {
        return expect(projectsWithStatuses.length).to.eql(1);
      });
    });

    it("merges in details of matching projects", function() {
      sinon.stub(api, "getProjects").resolves([
        { id: "id-123", lastBuildStatus: "passing" }
      ]);

      return Project.getProjectStatuses([{ id: "id-123", path: "/_test-output/path/to/project" }])
      .then(projectsWithStatuses => {
        return expect(projectsWithStatuses[0]).to.eql({
          id: "id-123",
          path: "/_test-output/path/to/project",
          lastBuildStatus: "passing",
          state: "VALID"
        });
      });
    });

    it("returns client project when it has no id", function() {
      sinon.stub(api, "getProjects").resolves([]);

      return Project.getProjectStatuses([{ path: "/_test-output/path/to/project" }])
      .then(projectsWithStatuses => {
        return expect(projectsWithStatuses[0]).to.eql({
          path: "/_test-output/path/to/project",
          state: "VALID"
        });
      });
    });

    return describe("when client project has id and there is no matching user project", function() {
      beforeEach(() => sinon.stub(api, "getProjects").resolves([]));

      it("marks project as invalid if api 404s", function() {
        sinon.stub(api, "getProject").rejects({name: "", message: "", statusCode: 404});

        return Project.getProjectStatuses([{ id: "id-123", path: "/_test-output/path/to/project" }])
        .then(projectsWithStatuses => {
          return expect(projectsWithStatuses[0]).to.eql({
            id: "id-123",
            path: "/_test-output/path/to/project",
            state: "INVALID"
          });
        });
      });

      it("marks project as unauthorized if api 403s", function() {
        sinon.stub(api, "getProject").rejects({name: "", message: "", statusCode: 403});

        return Project.getProjectStatuses([{ id: "id-123", path: "/_test-output/path/to/project" }])
        .then(projectsWithStatuses => {
          return expect(projectsWithStatuses[0]).to.eql({
            id: "id-123",
            path: "/_test-output/path/to/project",
            state: "UNAUTHORIZED"
          });
        });
      });

      it("merges in project details and marks valid if somehow project exists and is authorized", function() {
        sinon.stub(api, "getProject").resolves({ id: "id-123", lastBuildStatus: "passing" });

        return Project.getProjectStatuses([{ id: "id-123", path: "/_test-output/path/to/project" }])
        .then(projectsWithStatuses => {
          return expect(projectsWithStatuses[0]).to.eql({
            id: "id-123",
            path: "/_test-output/path/to/project",
            lastBuildStatus: "passing",
            state: "VALID"
          });
        });
      });

      return it("throws error if not accounted for", function() {
        const error = {name: "", message: ""};
        sinon.stub(api, "getProject").rejects(error);

        return Project.getProjectStatuses([{ id: "id-123", path: "/_test-output/path/to/project" }])
        .then(() => {
          throw new Error("should have caught error but did not");
      }).catch(err => expect(err).to.equal(error));
      });
    });
  });

  context(".getProjectStatus", function() {
    beforeEach(function() {
      this.clientProject = {
        id: "id-123",
        path: "/_test-output/path/to/project"
      };
      return sinon.stub(user, "ensureAuthToken").resolves("auth-token-123");
    });

    it("gets project from api", function() {
      sinon.stub(api, "getProject").resolves([]);

      return Project.getProjectStatus(this.clientProject)
      .then(() => expect(api.getProject).to.have.been.calledWith("id-123", "auth-token-123"));
    });

    it("returns project merged with details", function() {
      sinon.stub(api, "getProject").resolves({
        lastBuildStatus: "passing"
      });

      return Project.getProjectStatus(this.clientProject)
      .then(project => {
        return expect(project).to.eql({
          id: "id-123",
          path: "/_test-output/path/to/project",
          lastBuildStatus: "passing",
          state: "VALID"
        });
      });
    });

    it("returns project, marked as valid, if it does not have an id, without querying api", function() {
      sinon.stub(api, "getProject");

      this.clientProject.id = undefined;
      return Project.getProjectStatus(this.clientProject)
      .then(project => {
        expect(project).to.eql({
          id: undefined,
          path: "/_test-output/path/to/project",
          state: "VALID"
        });
        return expect(api.getProject).not.to.be.called;
      });
    });

    it("marks project as invalid if api 404s", function() {
      sinon.stub(api, "getProject").rejects({name: "", message: "", statusCode: 404});

      return Project.getProjectStatus(this.clientProject)
      .then(project => {
        return expect(project).to.eql({
          id: "id-123",
          path: "/_test-output/path/to/project",
          state: "INVALID"
        });
      });
    });

    it("marks project as unauthorized if api 403s", function() {
      sinon.stub(api, "getProject").rejects({name: "", message: "", statusCode: 403});

      return Project.getProjectStatus(this.clientProject)
      .then(project => {
        return expect(project).to.eql({
          id: "id-123",
          path: "/_test-output/path/to/project",
          state: "UNAUTHORIZED"
        });
      });
    });

    return it("throws error if not accounted for", function() {
      const error = {name: "", message: ""};
      sinon.stub(api, "getProject").rejects(error);

      return Project.getProjectStatus(this.clientProject)
      .then(() => {
        throw new Error("should have caught error but did not");
    }).catch(err => expect(err).to.equal(error));
    });
  });

  context(".getSecretKeyByPath", function() {
    beforeEach(() => sinon.stub(user, "ensureAuthToken").resolves("auth-token-123"));

    it("calls api.getProjectToken with id + session", function() {
      sinon.stub(api, "getProjectToken")
        .withArgs(this.projectId, "auth-token-123")
        .resolves("key-123");

      return Project.getSecretKeyByPath(this.todosPath).then(key => expect(key).to.eq("key-123"));
    });

    return it("throws CANNOT_FETCH_PROJECT_TOKEN on error", function() {
      sinon.stub(api, "getProjectToken")
        .withArgs(this.projectId, "auth-token-123")
        .rejects(new Error());

      return Project.getSecretKeyByPath(this.todosPath)
      .then(function() {
        throw new Error("should have caught error but did not");}).catch(err => expect(err.type).to.eq("CANNOT_FETCH_PROJECT_TOKEN"));
    });
  });

  return context(".generateSecretKeyByPath", function() {
    beforeEach(() => sinon.stub(user, "ensureAuthToken").resolves("auth-token-123"));

    it("calls api.updateProjectToken with id + session", function() {
      sinon.stub(api, "updateProjectToken")
        .withArgs(this.projectId, "auth-token-123")
        .resolves("new-key-123");

      return Project.generateSecretKeyByPath(this.todosPath).then(key => expect(key).to.eq("new-key-123"));
    });

    return it("throws CANNOT_CREATE_PROJECT_TOKEN on error", function() {
      sinon.stub(api, "updateProjectToken")
        .withArgs(this.projectId, "auth-token-123")
        .rejects(new Error());

      return Project.generateSecretKeyByPath(this.todosPath)
      .then(function() {
        throw new Error("should have caught error but did not");}).catch(err => expect(err.type).to.eq("CANNOT_CREATE_PROJECT_TOKEN"));
    });
  });
});
