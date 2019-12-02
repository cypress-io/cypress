/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _         = require("lodash");
const la        = require("lazy-ass");
const debug     = require("debug")("cypress:server:openproject");
const Promise   = require("bluebird");
const path      = require("path");
const chokidar  = require("chokidar");
const files     = require("./controllers/files");
const config    = require("./config");
const Project   = require("./project");
const browsers  = require("./browsers");
const specsUtil = require("./util/specs");
const preprocessor = require("./plugins/preprocessor");

const moduleFactory = function() {
  let openProject     = null;
  let relaunchBrowser = null;
  let specsWatcher    = null;

  const reset = function() {
    openProject     = null;
    return relaunchBrowser = null;
  };

  const tryToCall = method =>
    function(...args) {
      if (openProject) {
        return openProject[method].apply(openProject, args);
      } else {
        return Promise.resolve(null);
      }
    }
  ;

  return {
    reset: tryToCall("reset"),

    getConfig: tryToCall("getConfig"),

    createCiProject: tryToCall("createCiProject"),

    getRecordKeys: tryToCall("getRecordKeys"),

    getRuns: tryToCall("getRuns"),

    requestAccess: tryToCall("requestAccess"),

    emit: tryToCall("emit"),

    getProject() { return openProject; },

    launch(browser, spec, options = {}) {
      debug("resetting project state, preparing to launch browser");

      la(_.isPlainObject(browser), "expected browser object:", browser);

      //# reset to reset server and socket state because
      //# of potential domain changes, request buffers, etc
      return this.reset()
      .then(() => openProject.getSpecUrl(spec.absolute)).then(url =>
        openProject.getConfig()
        .then(function(cfg) {
          let am;
          options.browsers          = cfg.browsers;
          options.proxyUrl          = cfg.proxyUrl;
          options.userAgent         = cfg.userAgent;
          options.proxyServer       = cfg.proxyUrl;
          options.socketIoRoute     = cfg.socketIoRoute;
          options.chromeWebSecurity = cfg.chromeWebSecurity;

          options.url = url;

          options.isTextTerminal = cfg.isTextTerminal;

          //# if we don't have the isHeaded property
          //# then we're in interactive mode and we
          //# can assume its a headed browser
          //# TODO: we should clean this up
          if (!_.has(browser, "isHeaded")) {
            browser.isHeaded = true;
            browser.isHeadless = false;
          }

          //# set the current browser object on options
          //# so we can pass it down
          options.browser = browser;

          openProject.setCurrentSpecAndBrowser(spec, browser);

          const automation = openProject.getAutomation();

          //# use automation middleware if its
          //# been defined here
          if (am = options.automationMiddleware) {
            automation.use(am);
          }

          automation.use({
            onBeforeRequest(message, data) {
              if (message === "take:screenshot") {
                data.specName = spec.name;
                return data;
              }
            }
          });

          const { onBrowserClose } = options;
          options.onBrowserClose = function() {
            if (spec && spec.absolute) {
              preprocessor.removeFile(spec.absolute, cfg);
            }

            if (onBrowserClose) {
              return onBrowserClose();
            }
          };

          return (relaunchBrowser = function() {
            debug(
              "launching browser: %o, spec: %s",
              browser,
              spec.relative
            );

            return browsers.open(browser, options, automation);
          })();
        })
      );
    },

    getSpecChanges(options = {}) {
      let currentSpecs = null;

      _.defaults(options, {
        onChange() {},
        onError() {}
      });

      const sendIfChanged = function(specs = []) {
        //# dont do anything if the specs haven't changed
        if (_.isEqual(specs, currentSpecs)) { return; }

        currentSpecs = specs;
        return options.onChange(specs);
      };

      const checkForSpecUpdates = _.debounce(() => {
        if (!openProject) {
          return this.stopSpecsWatcher();
        }

        debug("check for spec updates");

        return get()
        .then(sendIfChanged)
        .catch(options.onError);
      }
      , 250, { leading: true });

      const createSpecsWatcher = function(cfg) {
        if (specsWatcher) { return; }

        debug("watch test files: %s in %s", cfg.testFiles, cfg.integrationFolder);

        specsWatcher = chokidar.watch(cfg.testFiles, {
          cwd: cfg.integrationFolder,
          ignored: cfg.ignoreTestFiles,
          ignoreInitial: true
        });
        specsWatcher.on("add", checkForSpecUpdates);
        return specsWatcher.on("unlink", checkForSpecUpdates);
      };

      var get = () =>
        openProject.getConfig()
        .then(function(cfg) {
          createSpecsWatcher(cfg);
          return specsUtil.find(cfg);}).then((specs = []) =>
          //# TODO: put back 'integration' property
          //# on the specs
          ({
            integration: specs
          }))
      ;

      //# immediately check the first time around
      return checkForSpecUpdates();
    },

    stopSpecsWatcher() {
      debug("stop spec watcher");
      return Promise.try(() => specsWatcher != null ? specsWatcher.close() : undefined);
    },

    closeBrowser() {
      return browsers.close();
    },

    closeOpenProjectAndBrowsers() {
      return Promise.all([
        this.closeBrowser(),
        openProject ? openProject.close() : undefined
      ])
      .then(function() {
        reset();

        return null;
      });
    },

    close() {
      debug("closing opened project");

      this.stopSpecsWatcher();
      return this.closeOpenProjectAndBrowsers();
    },

    create(path, args = {}, options = {}) {
      debug("open_project create %s", path);
      debug("and options %o", options);

      //# store the currently open project
      openProject = new Project(path);

      _.defaults(options, {
        onReloadBrowser: (url, browser) => {
          if (relaunchBrowser) {
            return relaunchBrowser();
          }
        }
      });

      if (!_.isUndefined(args.configFile)) {
        options.configFile = args.configFile;
      }

      options = _.extend({}, args.config, options);

      //# open the project and return
      //# the config for the project instance
      debug("opening project %s", path);
      debug("and options %o", options);

      return openProject.open(options)
      .return(this);
    }
  };
};

module.exports = moduleFactory();
module.exports.Factory = moduleFactory;
