'use strict'
// @ts-nocheck
let __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
  function adopt (value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value)
    })
  }

  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled (value) {
      try {
        step(generator.next(value))
      } catch (e) {
        reject(e)
      }
    }
    function rejected (value) {
      try {
        step(generator['throw'](value))
      } catch (e) {
        reject(e)
      }
    }
    function step (result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected)
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next())
  })
}
let __importDefault = (this && this.__importDefault) || function (mod) {
  return (mod && mod.__esModule) ? mod : { 'default': mod }
}

Object.defineProperty(exports, '__esModule', { value: true })
exports.ProjectBase = void 0

const bluebird_1 = __importDefault(require('bluebird'))
const check_more_types_1 = __importDefault(require('check-more-types'))
const debug_1 = __importDefault(require('debug'))
const events_1 = __importDefault(require('events'))
const lazy_ass_1 = __importDefault(require('lazy-ass'))
const lodash_1 = __importDefault(require('lodash'))
const path_1 = __importDefault(require('path'))
const ramda_1 = __importDefault(require('ramda'))
const commit_info_1 = __importDefault(require('@cypress/commit-info'))
const root_1 = __importDefault(require('@packages/root'))
const api_1 = __importDefault(require('./api'))
const automation_1 = require('./automation')
const cache_1 = __importDefault(require('./cache'))
const config_1 = __importDefault(require('./config'))
const cwd_1 = __importDefault(require('./cwd'))
const errors_1 = __importDefault(require('./errors'))
const logger_1 = __importDefault(require('./logger'))
const reporter_1 = __importDefault(require('./reporter'))
const run_events_1 = __importDefault(require('./plugins/run_events'))
const saved_state_1 = __importDefault(require('./saved_state'))
const scaffold_1 = __importDefault(require('./scaffold'))
const system_1 = __importDefault(require('./util/system'))
const user_1 = __importDefault(require('./user'))
const class_helpers_1 = require('./util/class-helpers')
const escape_filename_1 = require('./util/escape_filename')
const fs_1 = require('./util/fs')
const keys_1 = __importDefault(require('./util/keys'))
const settings_1 = __importDefault(require('./util/settings'))
const plugins_1 = __importDefault(require('./plugins'))
const specs_1 = __importDefault(require('./util/specs'))
const watchers_1 = __importDefault(require('./watchers'))
const dev_server_1 = __importDefault(require('./plugins/dev-server'))
const specs_store_1 = require('./specs-store')
const localCwd = cwd_1.default()
const multipleForwardSlashesRe = /[^:\/\/](\/{2,})/g
const backSlashesRe = /\\/g
const debug = debug_1.default('cypress:server:project')
const debugScaffold = debug_1.default('cypress:server:scaffold')

class ProjectBase extends events_1.default {
  constructor (projectRoot) {
    super()
    this._recordTests = null
    this.ensureProp = class_helpers_1.ensureProp
    this.shouldCorrelatePreRequests = () => {
      if (!this.browser) {
        return false
      }

      const { family, majorVersion } = this.browser

      return family === 'chromium' || (family === 'firefox' && majorVersion >= 86)
    }

    if (!projectRoot) {
      throw new Error('Instantiating lib/project requires a projectRoot!')
    }

    if (!check_more_types_1.default.unemptyString(projectRoot)) {
      throw new Error(`Expected project root path, not ${projectRoot}`)
    }

    this.projectRoot = path_1.default.resolve(projectRoot)
    this.watchers = new watchers_1.default()
    this.spec = null
    this.browser = null
    debug('Project created %o', {
      projectType: this.projectType,
      projectRoot: this.projectRoot,
    })
  }
  get projectType () {
    if (this.constructor === ProjectBase) {
      return 'base'
    }

    throw new Error('Project#projectType must be defined')
  }
  setOnTestsReceived (fn) {
    this._recordTests = fn
  }
  get server () {
    return this.ensureProp(this._server, 'open')
  }
  get automation () {
    return this.ensureProp(this._automation, 'open')
  }
  get cfg () {
    return this.ensureProp(this._cfg, 'open')
  }
  get state () {
    return this.cfg.state
  }
  open (options = {}, callbacks) {
    debug('opening project instance %s', this.projectRoot)
    debug('project open options %o', options)
    lodash_1.default.defaults(options, {
      report: false,
      onFocusTests () { },
      onError () { },
      onWarning () { },
      onSettingsChanged: false,
    })

    debug('project options %o', options)
    this.options = options

    return this.getConfig(options)
    .tap((cfg) => {
      process.chdir(this.projectRoot)
      // attach warning message if user has "chromeWebSecurity: false" for unsupported browser
      if (cfg.chromeWebSecurity === false) {
        lodash_1.default.chain(cfg.browsers)
        .filter((browser) => browser.family !== 'chromium')
        .each((browser) => browser.warning = errors_1.default.getMsgByType('CHROME_WEB_SECURITY_NOT_SUPPORTED', browser.name))
        .value()
      }

      // TODO: we currently always scaffold the plugins file
      // even when headlessly or else it will cause an error when
      // we try to load it and it's not there. We must do this here
      // else initialing the plugins will instantly fail.
      if (cfg.pluginsFile) {
        debug('scaffolding with plugins file %s', cfg.pluginsFile)

        return scaffold_1.default.plugins(path_1.default.dirname(cfg.pluginsFile), cfg)
      }
    })
    .then(callbacks.onOpen)
    .tap(({ cfg, port }) => {
      // if we didnt have a cfg.port
      // then get the port once we
      // open the server
      if (!cfg.port) {
        cfg.port = port
        // and set all the urls again
        lodash_1.default.extend(cfg, config_1.default.setUrls(cfg))
      }
    })
    .tap(callbacks.onAfterOpen)
    .then(({ cfg, port, warning, startSpecWatcher, specsStore }) => {
      // store the cfg from
      // opening the server
      this._cfg = cfg
      debug('project config: %o', lodash_1.default.omit(cfg, 'resolved'))
      if (warning) {
        options.onWarning(warning)
      }

      options.onSavedStateChanged = (state) => this.saveState(state)
      // save the last time they opened the project
      // along with the first time they opened it
      const now = Date.now()
      const stateToSave = {
        lastOpened: now,
      }

      if (!cfg.state || !cfg.state.firstOpened) {
        stateToSave.firstOpened = now
      }

      return bluebird_1.default.join(this.watchSettingsAndStartWebsockets(options, cfg), this.scaffold(cfg), this.saveState(stateToSave))
      .then(() => {
        // start watching specs
        // whenever a spec file is added or removed, we notify the
        // <SpecList>
        // This is only used for CT right now, but it will be
        // used for E2E eventually. Until then, do not watch
        // the specs.
        if (this.projectType === 'ct') {
          startSpecWatcher()
        }

        return bluebird_1.default.join(this.checkSupportFile(cfg), this.watchPluginsFile(cfg, options))
      })
      .then(() => {
        if (cfg.isTextTerminal || !cfg.experimentalInteractiveRunEvents) {
          return
        }

        return system_1.default.info()
        .then((sys) => {
          const beforeRunDetails = {
            config: cfg,
            cypressVersion: root_1.default.version,
            system: lodash_1.default.pick(sys, 'osName', 'osVersion'),
          }

          return run_events_1.default.execute('before:run', cfg, beforeRunDetails)
        })
      })
    })
    .return(this)
  }
  getRuns () {
    return bluebird_1.default.all([
      this.getProjectId(),
      user_1.default.ensureAuthToken(),
    ])
    .spread((projectId, authToken) => {
      return api_1.default.getProjectRuns(projectId, authToken)
    })
  }
  reset () {
    debug('resetting project instance %s', this.projectRoot)
    this.spec = null
    this.browser = null

    return bluebird_1.default.try(() => {
      if (this._automation) {
        this._automation.reset()
      }

      if (this._server) {
        return this._server.reset()
      }
    })
  }
  close (options) {
    let _a; let _b

    debug('closing project instance %s', this.projectRoot)
    this.spec = null
    this.browser = null

    return bluebird_1.default.join((_a = this.server) === null || _a === void 0 ? void 0 : _a.close(), (_b = this.watchers) === null || _b === void 0 ? void 0 : _b.close(), options === null || options === void 0 ? void 0 : options.onClose())
    .then(() => {
      process.chdir(localCwd)

      return this.getConfig()
    })
    .then((config) => {
      if (config.isTextTerminal || !config.experimentalInteractiveRunEvents) {
        return
      }

      return run_events_1.default.execute('after:run', config)
    })
  }
  checkSupportFile (cfg) {
    const supportFile = cfg.supportFile

    if (supportFile) {
      return fs_1.fs.pathExists(supportFile)
      .then((found) => {
        if (!found) {
          errors_1.default.throw('SUPPORT_FILE_NOT_FOUND', supportFile, settings_1.default.configFile(cfg))
        }
      })
    }
  }
  _onError (err, options) {
    throw Error(`_onError must be implemented by the super class!`)
  }
  _initPlugins (cfg, options) {
    // only init plugins with the
    // allowed config values to
    // prevent tampering with the
    // internals and breaking cypress
    const allowedCfg = config_1.default.allowed(cfg)

    return plugins_1.default.init(allowedCfg, {
      projectRoot: this.projectRoot,
      configFile: settings_1.default.pathToConfigFile(this.projectRoot, options),
      testingType: options.testingType,
      onError: (err) => this._onError(err, options),
      onWarning: options.onWarning,
    })
    .then((modifiedCfg) => {
      debug('plugin config yielded: %o', modifiedCfg)
      const updatedConfig = config_1.default.updateWithPluginValues(cfg, modifiedCfg)

      if (this.projectType === 'ct') {
        updatedConfig.componentTesting = true
        // This value is normally set up in the `packages/server/lib/plugins/index.js#110`
        // But if we don't return it in the plugins function, it never gets set
        // Since there is no chance that it will have any other value here, we set it to "component"
        // This allows users to not return config in the `cypress/plugins/index.js` file
        // https://github.com/cypress-io/cypress/issues/16860
        updatedConfig.resolved.testingType = { value: 'component' }
      }

      debug('updated config: %o', updatedConfig)

      return bluebird_1.default.resolve(updatedConfig)
    })
    .then((modifiedConfig) => {
      return __awaiter(this, void 0, void 0, function* () {
        const specs = (yield specs_1.default.find(modifiedConfig)).filter((spec) => {
          if (this.projectType === 'ct') {
            return spec.specType === 'component'
          }

          if (this.projectType === 'e2e') {
            return spec.specType === 'integration'
          }

          throw Error(`Cannot return specType for projectType: ${this.projectType}`)
        })

        return this.initSpecStore({ specs, config: modifiedConfig })
      })
    })
  }
  startCtDevServer (specs, config) {
    return __awaiter(this, void 0, void 0, function* () {
      // CT uses a dev-server to build the bundle.
      // We start the dev server here.
      const devServerOptions = yield dev_server_1.default.start({ specs, config })

      if (!devServerOptions) {
        throw new Error([
          'It looks like nothing was returned from on(\'dev-server:start\', {here}).',
          'Make sure that the dev-server:start function returns an object.',
          'For example: on("dev-server:start", () => startWebpackDevServer({ webpackConfig }))',
        ].join('\n'))
      }

      return { port: devServerOptions.port }
    })
  }
  initSpecStore ({ specs, config }) {
    return __awaiter(this, void 0, void 0, function* () {
      const specsStore = new specs_store_1.SpecsStore(config, this.projectType)

      if (this.projectType === 'ct') {
        const { port } = yield this.startCtDevServer(specs, config)

        config.baseUrl = `http://localhost:${port}`
      }

      const startSpecWatcher = () => {
        return specsStore.watch({
          onSpecsChanged: (specs) => {
            // both e2e and CT watch the specs and send them to the
            // client to be shown in the SpecList.
            this.server.sendSpecList(specs)
            if (this.projectType === 'ct') {
              // ct uses the dev-server to build and bundle the speces.
              // send new files to dev server
              dev_server_1.default.updateSpecs(specs)
            }
          },
        })
      }

      return specsStore.storeSpecFiles()
      .return({
        specsStore,
        cfg: config,
        startSpecWatcher,
      })
    })
  }
  watchPluginsFile (cfg, options) {
    debug(`attempt watch plugins file: ${cfg.pluginsFile}`)
    if (!cfg.pluginsFile || options.isTextTerminal) {
      return bluebird_1.default.resolve()
    }

    return fs_1.fs.pathExists(cfg.pluginsFile)
    .then((found) => {
      debug(`plugins file found? ${found}`)
      // ignore if not found. plugins#init will throw the right error
      if (!found) {
        return
      }

      debug('watch plugins file')

      return this.watchers.watchTree(cfg.pluginsFile, {
        onChange: () => {
          // TODO: completely re-open project instead?
          debug('plugins file changed')
          // re-init plugins after a change
          this._initPlugins(cfg, options)
          .catch((err) => {
            options.onError(err)
          })
        },
      })
    })
  }
  watchSettings (onSettingsChanged, options) {
    // bail if we havent been told to
    // watch anything (like in run mode)
    if (!onSettingsChanged) {
      return
    }

    debug('watch settings files')
    const obj = {
      onChange: () => {
        // dont fire change events if we generated
        // a project id less than 1 second ago
        if (this.generatedProjectIdTimestamp &&
                    ((Date.now() - this.generatedProjectIdTimestamp) < 1000)) {
          return
        }

        // call our callback function
        // when settings change!
        onSettingsChanged.call(this)
      },
    }

    if (options.configFile !== false) {
      this.watchers.watch(settings_1.default.pathToConfigFile(this.projectRoot, options), obj)
    }

    return this.watchers.watch(settings_1.default.pathToCypressEnvJson(this.projectRoot), obj)
  }
  watchSettingsAndStartWebsockets (options = {}, cfg = {}) {
    this.watchSettings(options.onSettingsChanged, options)
    const { projectRoot } = cfg
    let { reporter } = cfg

    // if we've passed down reporter
    // then record these via mocha reporter
    if (cfg.report) {
      try {
        reporter_1.default.loadReporter(reporter, projectRoot)
      } catch (err) {
        const paths = reporter_1.default.getSearchPathsForReporter(reporter, projectRoot)
        // only include the message if this is the standard MODULE_NOT_FOUND
        // else include the whole stack
        const errorMsg = err.code === 'MODULE_NOT_FOUND' ? err.message : err.stack

        errors_1.default.throw('INVALID_REPORTER_NAME', {
          paths,
          error: errorMsg,
          name: reporter,
        })
      }
      reporter = reporter_1.default.create(reporter, cfg.reporterOptions, projectRoot)
    }

    const onBrowserPreRequest = (browserPreRequest) => {
      this.server.addBrowserPreRequest(browserPreRequest)
    }

    this._automation = new automation_1.Automation(cfg.namespace, cfg.socketIoCookie, cfg.screenshotsFolder, onBrowserPreRequest)
    this.server.startWebsockets(this.automation, cfg, {
      onReloadBrowser: options.onReloadBrowser,
      onFocusTests: options.onFocusTests,
      onSpecChanged: options.onSpecChanged,
      onSavedStateChanged: options.onSavedStateChanged,
      onCaptureVideoFrames: (data) => {
        // TODO: move this to browser automation middleware
        this.emit('capture:video:frames', data)
      },
      onConnect: (id) => {
        debug('socket:connected')
        this.emit('socket:connected', id)
      },
      onTestsReceivedAndMaybeRecord: (runnables, cb) => {
        return __awaiter(this, void 0, void 0, function* () {
          debug('received runnables %o', runnables)
          if (reporter != null) {
            reporter.setRunnables(runnables)
          }

          if (this._recordTests) {
            yield this._recordTests(runnables, cb)
            this._recordTests = null

            return
          }

          cb()
        })
      },
      onMocha: (event, runnable) => {
        debug('onMocha', event)
        // bail if we dont have a
        // reporter instance
        if (!reporter) {
          return
        }

        reporter.emit(event, runnable)
        if (event === 'end') {
          return bluebird_1.default.all([
            (reporter != null ? reporter.end() : undefined),
            this.server.end(),
          ])
          .spread((stats = {}) => {
            this.emit('end', stats)
          })
        }
      },
    })
  }
  changeToUrl (url) {
    this.server.changeToUrl(url)
  }
  setCurrentSpecAndBrowser (spec, browser) {
    this.spec = spec
    this.browser = browser
  }
  getCurrentSpecAndBrowser () {
    return {
      spec: this.spec,
      browser: this.browser,
    }
  }
  setBrowsers (browsers = []) {
    debug('getting config before setting browsers %o', browsers)

    return this.getConfig()
    .then((cfg) => {
      debug('setting config browsers to %o', browsers)
      cfg.browsers = browsers
    })
  }
  getAutomation () {
    return this.automation
  }
  // do not check files again and again - keep previous promise
  // to refresh it - just close and open the project again.
  determineIsNewProject (folder) {
    return scaffold_1.default.isNewProject(folder)
  }
  // returns project config (user settings + defaults + cypress.json)
  // with additional object "state" which are transient things like
  // window width and height, DevTools open or not, etc.
  getConfig (options = {}) {
    if (options == null) {
      options = this.options
    }

    if (this._cfg) {
      debug('project has config %o', this._cfg)

      return bluebird_1.default.resolve(this._cfg)
    }

    const setNewProject = (cfg) => {
      if (cfg.isTextTerminal) {
        return
      }

      // decide if new project by asking scaffold
      // and looking at previously saved user state
      if (!cfg.integrationFolder) {
        throw new Error('Missing integration folder')
      }

      return this.determineIsNewProject(cfg.integrationFolder)
      .then((untouchedScaffold) => {
        const userHasSeenOnBoarding = lodash_1.default.get(cfg, 'state.showedOnBoardingModal', false)

        debugScaffold(`untouched scaffold ${untouchedScaffold} modal closed ${userHasSeenOnBoarding}`)
        cfg.isNewProject = untouchedScaffold && !userHasSeenOnBoarding
      })
    }

    return config_1.default.get(this.projectRoot, options)
    .then((cfg) => {
      return this._setSavedState(cfg)
    })
    .tap(setNewProject)
  }
  // forces saving of project's state by first merging with argument
  saveState (stateChanges = {}) {
    if (!this.cfg) {
      throw new Error('Missing project config')
    }

    if (!this.projectRoot) {
      throw new Error('Missing project root')
    }

    const newState = lodash_1.default.merge({}, this.cfg.state, stateChanges)

    return saved_state_1.default.create(this.projectRoot, this.cfg.isTextTerminal)
    .then((state) => state.set(newState))
    .then(() => {
      this.cfg.state = newState

      return newState
    })
  }
  _setSavedState (cfg) {
    debug('get saved state')

    return saved_state_1.default.create(this.projectRoot, cfg.isTextTerminal)
    .then((state) => state.get())
    .then((state) => {
      cfg.state = state

      return cfg
    })
  }
  getSpecUrl (absoluteSpecPath, specType) {
    debug('get spec url: %s for spec type %s', absoluteSpecPath, specType)

    return this.getConfig()
    .then((cfg) => {
      // if we don't have a absoluteSpecPath or its __all
      if (!absoluteSpecPath || (absoluteSpecPath === '__all')) {
        const url = this.normalizeSpecUrl(cfg.browserUrl, '/__all')

        debug('returning url to run all specs: %s', url)

        return url
      }

      // TODO:
      // to handle both unit + integration tests we need
      // to figure out (based on the config) where this absoluteSpecPath
      // lives. does it live in the integrationFolder or
      // the unit folder?
      // once we determine that we can then prefix it correctly
      // with either integration or unit
      const prefixedPath = this.getPrefixedPathToSpec(cfg, absoluteSpecPath, specType)
      const url = this.normalizeSpecUrl(cfg.browserUrl, prefixedPath)

      debug('return path to spec %o', { specType, absoluteSpecPath, prefixedPath, url })

      return url
    })
  }
  getPrefixedPathToSpec (cfg, pathToSpec, type = 'integration') {
    const { integrationFolder, componentFolder, projectRoot } = cfg
    // for now hard code the 'type' as integration
    // but in the future accept something different here
    // strip out the integration folder and prepend with "/"
    // example:
    //
    // /Users/bmann/Dev/cypress-app/.projects/cypress/integration
    // /Users/bmann/Dev/cypress-app/.projects/cypress/integration/foo.js
    //
    // becomes /integration/foo.js
    const folderToUse = type === 'integration' ? integrationFolder : componentFolder
    // To avoid having invalid urls from containing backslashes,
    // we normalize specUrls to posix by replacing backslash by slash
    // Indeed, path.realtive will return something different on windows
    // than on posix systems which can lead to problems
    const url = `/${path_1.default.join(type, path_1.default.relative(folderToUse, path_1.default.resolve(projectRoot, pathToSpec))).replace(backSlashesRe, '/')}`

    debug('prefixed path for spec %o', { pathToSpec, type, url })

    return url
  }
  normalizeSpecUrl (browserUrl, specUrl) {
    const replacer = (match) => match.replace('//', '/')

    return [
      browserUrl,
      '#/tests',
      escape_filename_1.escapeFilenameInUrl(specUrl),
    ].join('/')
    .replace(multipleForwardSlashesRe, replacer)
  }
  scaffold (cfg) {
    debug('scaffolding project %s', this.projectRoot)
    const scaffolds = []
    const push = scaffolds.push.bind(scaffolds)

    // TODO: we are currently always scaffolding support
    // even when headlessly - this is due to a major breaking
    // change of 0.18.0
    // we can later force this not to always happen when most
    // of our users go beyond 0.18.0
    //
    // ensure support dir is created
    // and example support file if dir doesnt exist
    push(scaffold_1.default.support(cfg.supportFolder, cfg))
    // if we're in headed mode add these other scaffolding tasks
    debug('scaffold flags %o', {
      isTextTerminal: cfg.isTextTerminal,
      CYPRESS_INTERNAL_FORCE_SCAFFOLD: process.env.CYPRESS_INTERNAL_FORCE_SCAFFOLD,
    })

    const scaffoldExamples = !cfg.isTextTerminal || process.env.CYPRESS_INTERNAL_FORCE_SCAFFOLD

    if (scaffoldExamples) {
      debug('will scaffold integration and fixtures folder')
      push(scaffold_1.default.integration(cfg.integrationFolder, cfg))
      push(scaffold_1.default.fixture(cfg.fixturesFolder, cfg))
    } else {
      debug('will not scaffold integration or fixtures folder')
    }

    return bluebird_1.default.all(scaffolds)
  }
  writeProjectId (id) {
    const attrs = { projectId: id }

    logger_1.default.info('Writing Project ID', lodash_1.default.clone(attrs))
    this.generatedProjectIdTimestamp = new Date()

    return settings_1.default
    .write(this.projectRoot, attrs)
    .return(id)
  }
  getProjectId () {
    return this.verifyExistence()
    .then(() => {
      return settings_1.default.read(this.projectRoot, this.options)
    })
    .then((readSettings) => {
      if (readSettings && readSettings.projectId) {
        return readSettings.projectId
      }

      errors_1.default.throw('NO_PROJECT_ID', settings_1.default.configFile(this.options), this.projectRoot)
    })
  }
  verifyExistence () {
    return fs_1.fs
    .statAsync(this.projectRoot)
    .return(this)
    .catch(() => {
      errors_1.default.throw('NO_PROJECT_FOUND_AT_PROJECT_ROOT', this.projectRoot)
    })
  }
  createCiProject (projectDetails) {
    debug('create CI project with projectDetails %o', projectDetails)

    return user_1.default.ensureAuthToken()
    .then((authToken) => {
      const remoteOrigin = commit_info_1.default.getRemoteOrigin(this.projectRoot)

      debug('found remote origin at projectRoot %o', {
        remoteOrigin,
        projectRoot: this.projectRoot,
      })

      return remoteOrigin
      .then((remoteOrigin) => {
        return api_1.default.createProject(projectDetails, remoteOrigin, authToken)
      })
    }).then((newProject) => {
      return this.writeProjectId(newProject.id)
      .return(newProject)
    })
  }
  getRecordKeys () {
    return bluebird_1.default.all([
      this.getProjectId(),
      user_1.default.ensureAuthToken(),
    ])
    .spread((projectId, authToken) => {
      return api_1.default.getProjectRecordKeys(projectId, authToken)
    })
  }
  requestAccess (projectId) {
    return user_1.default.ensureAuthToken()
    .then((authToken) => {
      return api_1.default.requestAccess(projectId, authToken)
    })
  }
  static getOrgs () {
    return user_1.default.ensureAuthToken()
    .then((authToken) => {
      return api_1.default.getOrgs(authToken)
    })
  }
  static paths () {
    return cache_1.default.getProjectRoots()
  }
  static getPathsAndIds () {
    return cache_1.default.getProjectRoots()
    // this assumes that the configFile for a cached project is 'cypress.json'
    // https://git.io/JeGyF
    .map((projectRoot) => {
      return bluebird_1.default.props({
        path: projectRoot,
        id: settings_1.default.id(projectRoot),
      })
    })
  }
  static getDashboardProjects () {
    return user_1.default.ensureAuthToken()
    .then((authToken) => {
      debug('got auth token: %o', { authToken: keys_1.default.hide(authToken) })

      return api_1.default.getProjects(authToken)
    })
  }
  static _mergeDetails (clientProject, project) {
    return lodash_1.default.extend({}, clientProject, project, { state: 'VALID' })
  }
  static _mergeState (clientProject, state) {
    return lodash_1.default.extend({}, clientProject, { state })
  }
  static _getProject (clientProject, authToken) {
    debug('get project from api', clientProject.id, clientProject.path)

    return api_1.default.getProject(clientProject.id, authToken)
    .then((project) => {
      debug('got project from api')

      return ProjectBase._mergeDetails(clientProject, project)
    }).catch((err) => {
      debug('failed to get project from api', err.statusCode)
      switch (err.statusCode) {
        case 404:
          // project doesn't exist
          return ProjectBase._mergeState(clientProject, 'INVALID')
        case 403:
          // project exists, but user isn't authorized for it
          return ProjectBase._mergeState(clientProject, 'UNAUTHORIZED')
        default:
          throw err
      }
    })
  }
  static getProjectStatuses (clientProjects = []) {
    debug(`get project statuses for ${clientProjects.length} projects`)

    return user_1.default.ensureAuthToken()
    .then((authToken) => {
      debug('got auth token: %o', { authToken: keys_1.default.hide(authToken) })

      return api_1.default.getProjects(authToken).then((projects = []) => {
        debug(`got ${projects.length} projects`)
        const projectsIndex = lodash_1.default.keyBy(projects, 'id')

        return bluebird_1.default.all(lodash_1.default.map(clientProjects, (clientProject) => {
          debug('looking at', clientProject.path)
          // not a CI project, just mark as valid and return
          if (!clientProject.id) {
            debug('no project id')

            return ProjectBase._mergeState(clientProject, 'VALID')
          }

          const project = projectsIndex[clientProject.id]

          if (project) {
            debug('found matching:', project)

            // merge in details for matching project
            return ProjectBase._mergeDetails(clientProject, project)
          }

          debug('did not find matching:', project)

          // project has id, but no matching project found
          // check if it doesn't exist or if user isn't authorized
          return ProjectBase._getProject(clientProject, authToken)
        }))
      })
    })
  }
  static getProjectStatus (clientProject) {
    debug('get project status for client id %s at path %s', clientProject.id, clientProject.path)
    if (!clientProject.id) {
      debug('no project id')

      return bluebird_1.default.resolve(ProjectBase._mergeState(clientProject, 'VALID'))
    }

    return user_1.default.ensureAuthToken().then((authToken) => {
      debug('got auth token: %o', { authToken: keys_1.default.hide(authToken) })

      return ProjectBase._getProject(clientProject, authToken)
    })
  }
  static remove (path) {
    return cache_1.default.removeProject(path)
  }
  static add (path, options) {
    // don't cache a project if a non-default configFile is set
    // https://git.io/JeGyF
    if (settings_1.default.configFile(options) !== 'cypress.json') {
      return bluebird_1.default.resolve({ path })
    }

    return cache_1.default.insertProject(path)
    .then(() => {
      return this.id(path)
    }).then((id) => {
      return { id, path }
    })
    .catch(() => {
      return { path }
    })
  }
  static id (path) {
    return new ProjectBase(path).getProjectId()
  }
  static ensureExists (path, options) {
    // is there a configFile? is the root writable?
    return settings_1.default.exists(path, options)
  }
  static config (path) {
    return new ProjectBase(path).getConfig()
  }
  static getSecretKeyByPath (path) {
    // get project id
    return ProjectBase.id(path)
    .then((id) => {
      return user_1.default.ensureAuthToken()
      .then((authToken) => {
        return api_1.default.getProjectToken(id, authToken)
        .catch(() => {
          errors_1.default.throw('CANNOT_FETCH_PROJECT_TOKEN')
        })
      })
    })
  }
  static generateSecretKeyByPath (path) {
    // get project id
    return ProjectBase.id(path)
    .then((id) => {
      return user_1.default.ensureAuthToken()
      .then((authToken) => {
        return api_1.default.updateProjectToken(id, authToken)
        .catch(() => {
          errors_1.default.throw('CANNOT_CREATE_PROJECT_TOKEN')
        })
      })
    })
  }
  // Given a path to the project, finds all specs
  // returns list of specs with respect to the project root
  static findSpecs (projectRoot, specPattern) {
    debug('finding specs for project %s', projectRoot)
    lazy_ass_1.default(check_more_types_1.default.unemptyString(projectRoot), 'missing project path', projectRoot)
    lazy_ass_1.default(check_more_types_1.default.maybe.unemptyString(specPattern), 'invalid spec pattern', specPattern)
    // if we have a spec pattern
    if (specPattern) {
      // then normalize to create an absolute
      // file path from projectRoot
      // ie: **/* turns into /Users/bmann/dev/project/**/*
      specPattern = path_1.default.resolve(projectRoot, specPattern)
      debug('full spec pattern "%s"', specPattern)
    }

    return new ProjectBase(projectRoot)
    .getConfig()
    // TODO: handle wild card pattern or spec filename
    .then((cfg) => {
      return specs_1.default.find(cfg, specPattern)
    }).then(ramda_1.default.prop('integration'))
    .then(ramda_1.default.map(ramda_1.default.prop('name')))
  }
}
exports.ProjectBase = ProjectBase
