/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _           = require("lodash");
const R           = require("ramda");
const EE          = require("events");
const path        = require("path");
const Promise     = require("bluebird");
const commitInfo  = require("@cypress/commit-info");
const la          = require("lazy-ass");
const check       = require("check-more-types");
const scaffoldDebug = require("debug")("cypress:server:scaffold");
const debug       = require("debug")("cypress:server:project");
const cwd         = require("./cwd");
const api         = require("./api");
const user        = require("./user");
const cache       = require("./cache");
const config      = require("./config");
const logger      = require("./logger");
const errors      = require("./errors");
const Server      = require("./server");
const plugins     = require("./plugins");
const scaffold    = require("./scaffold");
const Watchers    = require("./watchers");
const Reporter    = require("./reporter");
const browsers    = require("./browsers");
const savedState  = require("./saved_state");
const Automation  = require("./automation");
const preprocessor = require("./plugins/preprocessor");
const fs          = require("./util/fs");
const keys        = require("./util/keys");
const settings    = require("./util/settings");
const specsUtil   = require("./util/specs");

const localCwd = cwd();

const multipleForwardSlashesRe = /[^:\/\/](\/{2,})/g;

class Project extends EE {
  constructor(projectRoot) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
      eval(`${thisName} = this;`);
    }
    this.getConfig = this.getConfig.bind(this);
    if (!(this instanceof Project)) {
      return new Project(projectRoot);
    }

    if (!projectRoot) {
      throw new Error("Instantiating lib/project requires a projectRoot!");
    }

    if (!check.unemptyString(projectRoot)) {
      throw new Error(`Expected project root path, not ${projectRoot}`);
    }

    this.projectRoot = path.resolve(projectRoot);
    this.watchers    = Watchers();
    this.cfg         = null;
    this.spec        = null;
    this.browser     = null;
    this.server      = null;
    this.memoryCheck = null;
    this.automation  = null;

    debug("Project created %s", this.projectRoot);
  }

  open(options = {}) {
    debug("opening project instance %s", this.projectRoot);
    debug("project open options %o", options);
    this.server = Server();

    _.defaults(options, {
      report:       false,
      onFocusTests() {},
      onError() {},
      onWarning() {},
      onSettingsChanged: false
    });

    debug("project options %o", options);
    this.options = options;

    if (process.env.CYPRESS_MEMORY) {
      const logMemory = () => console.log("memory info", process.memoryUsage());

      this.memoryCheck = setInterval(logMemory, 1000);
    }

    this.onWarning = options.onWarning;

    return this.getConfig(options)
    .tap(cfg => {
      process.chdir(this.projectRoot);

      //# TODO: we currently always scaffold the plugins file
      //# even when headlessly or else it will cause an error when
      //# we try to load it and it's not there. We must do this here
      //# else initialing the plugins will instantly fail.
      if (cfg.pluginsFile) {
        debug("scaffolding with plugins file %s", cfg.pluginsFile);
        return scaffold.plugins(path.dirname(cfg.pluginsFile), cfg);
      }
  }).then(cfg => {
      return this._initPlugins(cfg, options)
      .then(function(modifiedCfg) {
        debug("plugin config yielded: %o", modifiedCfg);

        const updatedConfig = config.updateWithPluginValues(cfg, modifiedCfg);
        debug("updated config: %o", updatedConfig);

        return updatedConfig;
      });
      }).then(cfg => {
      return this.server.open(cfg, this, options.onWarning)
      .spread((port, warning) => {
        //# if we didnt have a cfg.port
        //# then get the port once we
        //# open the server
        if (!cfg.port) {
          cfg.port = port;

          //# and set all the urls again
          _.extend(cfg, config.setUrls(cfg));
        }

        //# store the cfg from
        //# opening the server
        this.cfg = cfg;

        debug("project config: %o", _.omit(cfg, "resolved"));

        if (warning) {
          options.onWarning(warning);
        }

        options.onSavedStateChanged = state => {
          return this.saveState(state);
        };

        return Promise.join(
          this.watchSettingsAndStartWebsockets(options, cfg),
          this.scaffold(cfg)
        )
        .then(() => {
          return Promise.join(
            this.checkSupportFile(cfg),
            this.watchPluginsFile(cfg, options)
          );
        });
      });
    }).return(this);
  }

  _initPlugins(cfg, options) {
    //# only init plugins with the
    //# whitelisted config values to
    //# prevent tampering with the
    //# internals and breaking cypress
    cfg = config.whitelist(cfg);

    return plugins.init(cfg, {
      onError(err) {
        debug('got plugins error', err.stack);

        browsers.close();
        return options.onError(err);
      }
    });
  }

  getRuns() {
    return Promise.all([
      this.getProjectId(),
      user.ensureAuthToken()
    ])
    .spread((projectId, authToken) => api.getProjectRuns(projectId, authToken));
  }

  reset() {
    debug("resetting project instance %s", this.projectRoot);

    this.spec = (this.browser = null);

    return Promise.try(() => {
      if (this.automation != null) {
        this.automation.reset();
      }
      return (this.server != null ? this.server.reset() : undefined);
    });
  }

  close() {
    debug("closing project instance %s", this.projectRoot);

    if (this.memoryCheck) {
      clearInterval(this.memoryCheck);
    }

    this.cfg = (this.spec = (this.browser = null));

    return Promise.join(
      this.server != null ? this.server.close() : undefined,
      this.watchers != null ? this.watchers.close() : undefined,
      preprocessor.close()
    )
    .then(() => process.chdir(localCwd));
  }

  checkSupportFile(cfg) {
    let supportFile;
    if (supportFile = cfg.supportFile) {
      return fs.pathExists(supportFile)
      .then(found => {
        if (!found) {
          return errors.throw("SUPPORT_FILE_NOT_FOUND", supportFile, settings.configFile(cfg));
        }
      });
    }
  }

  watchPluginsFile(cfg, options) {
    debug(`attempt watch plugins file: ${cfg.pluginsFile}`);
    if (!cfg.pluginsFile || options.isTextTerminal) {
      return Promise.resolve();
    }

    return fs.pathExists(cfg.pluginsFile)
    .then(found => {
      debug(`plugins file found? ${found}`);
      //# ignore if not found. plugins#init will throw the right error
      if (!found) { return; }

      debug("watch plugins file");
      return this.watchers.watchTree(cfg.pluginsFile, {
        onChange: () => {
          //# TODO: completely re-open project instead?
          debug("plugins file changed");
          //# re-init plugins after a change
          return this._initPlugins(cfg, options)
          .catch(err => options.onError(err));
        }
      });
    });
  }

  watchSettings(onSettingsChanged, options) {
    //# bail if we havent been told to
    //# watch anything (like in run mode)
    if (!onSettingsChanged) { return; }

    debug("watch settings files");

    const obj = {
      onChange: (filePath, stats) => {
        //# dont fire change events if we generated
        //# a project id less than 1 second ago
        if (this.generatedProjectIdTimestamp &&
          ((new Date - this.generatedProjectIdTimestamp) < 1000)) { return; }

        //# call our callback function
        //# when settings change!
        return onSettingsChanged.call(this);
      }
    };

    if (options.configFile !== false) {
      this.watchers.watch(settings.pathToConfigFile(this.projectRoot, options), obj);
    }

    return this.watchers.watch(settings.pathToCypressEnvJson(this.projectRoot), obj);
  }

  watchSettingsAndStartWebsockets(options = {}, cfg = {}) {
    this.watchSettings(options.onSettingsChanged, options);

    let { reporter, projectRoot } = cfg;

    //# if we've passed down reporter
    //# then record these via mocha reporter
    if (cfg.report) {
      try {
        Reporter.loadReporter(reporter, projectRoot);
      } catch (err) {
        const paths = Reporter.getSearchPathsForReporter(reporter, projectRoot);

        //# only include the message if this is the standard MODULE_NOT_FOUND
        //# else include the whole stack
        const errorMsg = err.code === "MODULE_NOT_FOUND" ? err.message : err.stack;

        errors.throw("INVALID_REPORTER_NAME", {
          paths,
          error: errorMsg,
          name: reporter
        });
      }

      reporter = Reporter.create(reporter, cfg.reporterOptions, projectRoot);
    }

    this.automation = Automation.create(cfg.namespace, cfg.socketIoCookie, cfg.screenshotsFolder);

    return this.server.startWebsockets(this.automation, cfg, {
      onReloadBrowser: options.onReloadBrowser,

      onFocusTests: options.onFocusTests,

      onSpecChanged: options.onSpecChanged,

      onSavedStateChanged: options.onSavedStateChanged,

      onConnect: id => {
        return this.emit("socket:connected", id);
      },

      onSetRunnables(runnables) {
        debug("received runnables %o", runnables);
        return (reporter != null ? reporter.setRunnables(runnables) : undefined);
      },

      onMocha: (event, runnable) => {
        debug("onMocha", event);
        //# bail if we dont have a
        //# reporter instance
        if (!reporter) { return; }

        reporter.emit(event, runnable);

        if (event === "end") {
          return Promise.all([
            (reporter != null ? reporter.end() : undefined),
            this.server.end()
          ])
          .spread((stats = {}) => {
            return this.emit("end", stats);
          });
        }
      }
    });
  }

  changeToUrl(url) {
    return this.server.changeToUrl(url);
  }

  setCurrentSpecAndBrowser(spec, browser) {
    this.spec = spec;
    return this.browser = browser;
  }

  getCurrentSpecAndBrowser() {
    return _.pick(this, "spec", "browser");
  }

  setBrowsers(browsers = []) {
    debug("getting config before setting browsers %o", browsers);
    return this.getConfig()
    .then(function(cfg) {
      debug("setting config browsers to %o", browsers);
      return cfg.browsers = browsers;
    });
  }

  getAutomation() {
    return this.automation;
  }

  //# do not check files again and again - keep previous promise
  //# to refresh it - just close and open the project again.
  determineIsNewProject(folder) {
    return scaffold.isNewProject(folder);
  }

  //# returns project config (user settings + defaults + cypress.json)
  //# with additional object "state" which are transient things like
  //# window width and height, DevTools open or not, etc.
  getConfig(options={}) {
    if (options == null) { ({ options } = this); }

    if (this.cfg) {
      return Promise.resolve(this.cfg);
    }

    const setNewProject = cfg => {
      if (cfg.isTextTerminal) { return; }

      //# decide if new project by asking scaffold
      //# and looking at previously saved user state
      if (!cfg.integrationFolder) {
        throw new Error("Missing integration folder");
      }

      return this.determineIsNewProject(cfg.integrationFolder)
      .then(function(untouchedScaffold) {
        const userHasSeenOnBoarding = _.get(cfg, 'state.showedOnBoardingModal', false);
        scaffoldDebug(`untouched scaffold ${untouchedScaffold} modal closed ${userHasSeenOnBoarding}`);
        return cfg.isNewProject = untouchedScaffold && !userHasSeenOnBoarding;
      });
    };

    return config.get(this.projectRoot, options)
    .then(cfg => this._setSavedState(cfg))
    .tap(setNewProject);
  }

  // forces saving of project's state by first merging with argument
  saveState(stateChanges = {}) {
    if (!this.cfg) { throw new Error("Missing project config"); }
    if (!this.projectRoot) { throw new Error("Missing project root"); }
    const newState = _.merge({}, this.cfg.state, stateChanges);
    return savedState(this.projectRoot, this.cfg.isTextTerminal)
    .then(state => state.set(newState)).then(() => {
      this.cfg.state = newState;
      return newState;
    });
  }

  _setSavedState(cfg) {
    debug("get saved state");
    return savedState(this.projectRoot, cfg.isTextTerminal)
    .then(state => state.get())
    .then(function(state) {
      cfg.state = state;
      return cfg;
    });
  }

  getSpecUrl(absoluteSpecPath) {
    return this.getConfig()
    .then(cfg => {
      //# if we dont have a absoluteSpecPath or its __all
      if (!absoluteSpecPath || (absoluteSpecPath === "__all")) {
        return this.normalizeSpecUrl(cfg.browserUrl, "/__all");
      } else {
        //# TODO:
        //# to handle both unit + integration tests we need
        //# to figure out (based on the config) where this absoluteSpecPath
        //# lives. does it live in the integrationFolder or
        //# the unit folder?
        //# once we determine that we can then prefix it correctly
        //# with either integration or unit
        const prefixedPath = this.getPrefixedPathToSpec(cfg, absoluteSpecPath);
        return this.normalizeSpecUrl(cfg.browserUrl, prefixedPath);
      }
    });
  }

  getPrefixedPathToSpec(cfg, pathToSpec, type = "integration") {
    const { integrationFolder, projectRoot } = cfg;

    //# for now hard code the 'type' as integration
    //# but in the future accept something different here

    //# strip out the integration folder and prepend with "/"
    //# example:
    //#
    //# /Users/bmann/Dev/cypress-app/.projects/cypress/integration
    //# /Users/bmann/Dev/cypress-app/.projects/cypress/integration/foo.coffee
    //#
    //# becomes /integration/foo.coffee
    return "/" + path.join(type, path.relative(
      integrationFolder,
      path.resolve(projectRoot, pathToSpec)
    ));
  }

  normalizeSpecUrl(browserUrl, specUrl) {
    const replacer = (match, p1) => match.replace("//", "/");

    return [
      browserUrl,
      "#/tests",
      specUrl
    ].join("/").replace(multipleForwardSlashesRe, replacer);
  }

  scaffold(cfg) {
    debug("scaffolding project %s", this.projectRoot);

    const scaffolds = [];

    const push = scaffolds.push.bind(scaffolds);

    //# TODO: we are currently always scaffolding support
    //# even when headlessly - this is due to a major breaking
    //# change of 0.18.0
    //# we can later force this not to always happen when most
    //# of our users go beyond 0.18.0
    //#
    //# ensure support dir is created
    //# and example support file if dir doesnt exist
    push(scaffold.support(cfg.supportFolder, cfg));

    //# if we're in headed mode add these other scaffolding
    //# tasks
    if (!cfg.isTextTerminal) {
      push(scaffold.integration(cfg.integrationFolder, cfg));
      push(scaffold.fixture(cfg.fixturesFolder, cfg));
    }

    return Promise.all(scaffolds);
  }

  writeProjectId(id) {
    const attrs = { projectId: id };
    logger.info("Writing Project ID", _.clone(attrs));

    this.generatedProjectIdTimestamp = new Date;

    return settings
    .write(this.projectRoot, attrs)
    .return(id);
  }

  getProjectId() {
    return this.verifyExistence()
    .then(() => {
      return settings.read(this.projectRoot, this.options);
  }).then(readSettings => {
      let id;
      if (readSettings && (id = readSettings.projectId)) {
        return id;
      }

      return errors.throw("NO_PROJECT_ID", settings.configFile(this.options), this.projectRoot);
    });
  }

  verifyExistence() {
    return fs
    .statAsync(this.projectRoot)
    .return(this)
    .catch(() => {
      return errors.throw("NO_PROJECT_FOUND_AT_PROJECT_ROOT", this.projectRoot);
    });
  }

  createCiProject(projectDetails) {
    return user.ensureAuthToken()
    .then(authToken => {
      return commitInfo.getRemoteOrigin(this.projectRoot)
      .then(remoteOrigin => api.createProject(projectDetails, remoteOrigin, authToken));
  }).then(newProject => {
      return this.writeProjectId(newProject.id)
      .return(newProject);
    });
  }

  getRecordKeys() {
    return Promise.all([
      this.getProjectId(),
      user.ensureAuthToken()
    ])
    .spread((projectId, authToken) => api.getProjectRecordKeys(projectId, authToken));
  }

  requestAccess(projectId) {
    return user.ensureAuthToken()
    .then(authToken => api.requestAccess(projectId, authToken));
  }

  static getOrgs() {
    return user.ensureAuthToken()
    .then(authToken => api.getOrgs(authToken));
  }

  static paths() {
    return cache.getProjectRoots();
  }

  static getPathsAndIds() {
    return cache.getProjectRoots()
    .map(projectRoot =>
      //# this assumes that the configFile for a cached project is 'cypress.json'
      //# https://git.io/JeGyF
      Promise.props({
        path: projectRoot,
        id: settings.id(projectRoot)
      })
    );
  }

  static _mergeDetails(clientProject, project) {
    return _.extend({}, clientProject, project, {state: "VALID"});
  }

  static _mergeState(clientProject, state) {
    return _.extend({}, clientProject, {state});
  }

  static _getProject(clientProject, authToken) {
    debug("get project from api", clientProject.id, clientProject.path);
    return api.getProject(clientProject.id, authToken)
    .then(function(project) {
      debug("got project from api");
      return Project._mergeDetails(clientProject, project);}).catch(function(err) {
      debug("failed to get project from api", err.statusCode);
      switch (err.statusCode) {
        case 404:
          //# project doesn't exist
          return Project._mergeState(clientProject, "INVALID");
        case 403:
          //# project exists, but user isn't authorized for it
          return Project._mergeState(clientProject, "UNAUTHORIZED");
        default:
          throw err;
      }
    });
  }

  static getProjectStatuses(clientProjects = []) {
    debug(`get project statuses for ${clientProjects.length} projects`);
    return user.ensureAuthToken()
    .then(function(authToken) {
      debug("got auth token: %o", { authToken: keys.hide(authToken) });

      return api.getProjects(authToken).then(function(projects = []) {
        debug(`got ${projects.length} projects`);
        const projectsIndex = _.keyBy(projects, "id");
        return Promise.all(_.map(clientProjects, function(clientProject) {
          let project;
          debug("looking at", clientProject.path);
          //# not a CI project, just mark as valid and return
          if (!clientProject.id) {
            debug("no project id");
            return Project._mergeState(clientProject, "VALID");
          }

          if (project = projectsIndex[clientProject.id]) {
            debug("found matching:", project);
            //# merge in details for matching project
            return Project._mergeDetails(clientProject, project);
          } else {
            debug("did not find matching:", project);
            //# project has id, but no matching project found
            //# check if it doesn't exist or if user isn't authorized
            return Project._getProject(clientProject, authToken);
          }
        }));
      });
    });
  }

  static getProjectStatus(clientProject) {
    debug("get project status for client id %s at path %s", clientProject.id, clientProject.path);

    if (!clientProject.id) {
      debug("no project id");
      return Promise.resolve(Project._mergeState(clientProject, "VALID"));
    }

    return user.ensureAuthToken().then(function(authToken) {
      debug("got auth token: %o", { authToken: keys.hide(authToken) });

      return Project._getProject(clientProject, authToken);
    });
  }

  static remove(path) {
    return cache.removeProject(path);
  }

  static add(path, options) {
    //# don't cache a project if a non-default configFile is set
    //# https://git.io/JeGyF
    if (settings.configFile(options) !== 'cypress.json') {
      return Promise.resolve({ path });
    }

    return cache.insertProject(path)
    .then(() => {
      return this.id(path);
  }).then(id => ({id, path}))
    .catch(() => ({path}));
  }

  static id(path) {
    return Project(path).getProjectId();
  }

  static ensureExists(path, options) {
    //# is there a configFile? is the root writable?
    return settings.exists(path, options);
  }

  static config(path) {
    return Project(path).getConfig();
  }

  static getSecretKeyByPath(path) {
    //# get project id
    return Project.id(path)
    .then(id =>
      user.ensureAuthToken()
      .then(authToken =>
        api.getProjectToken(id, authToken)
        .catch(() => errors.throw("CANNOT_FETCH_PROJECT_TOKEN"))
      )
    );
  }

  static generateSecretKeyByPath(path) {
    //# get project id
    return Project.id(path)
    .then(id =>
      user.ensureAuthToken()
      .then(authToken =>
        api.updateProjectToken(id, authToken)
        .catch(() => errors.throw("CANNOT_CREATE_PROJECT_TOKEN"))
      )
    );
  }

  // Given a path to the project, finds all specs
  // returns list of specs with respect to the project root
  static findSpecs(projectRoot, specPattern) {
    debug("finding specs for project %s", projectRoot);
    la(check.unemptyString(projectRoot), "missing project path", projectRoot);
    la(check.maybe.unemptyString(specPattern), "invalid spec pattern", specPattern);

    //# if we have a spec pattern
    if (specPattern) {
      //# then normalize to create an absolute
      //# file path from projectRoot
      //# ie: **/* turns into /Users/bmann/dev/project/**/*
      specPattern = path.resolve(projectRoot, specPattern);
    }

    return Project(projectRoot)
    .getConfig()
    // TODO: handle wild card pattern or spec filename
    .then(cfg => specsUtil.find(cfg, specPattern)).then(R.prop("integration"))
    .then(R.map(R.prop("name")));
  }
}

module.exports = Project;
