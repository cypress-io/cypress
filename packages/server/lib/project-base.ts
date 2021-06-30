import Bluebird from 'bluebird'
import check from 'check-more-types'
import Debug from 'debug'
import EE from 'events'
import _ from 'lodash'
import path from 'path'

import commitInfo from '@cypress/commit-info'
import browsers from './browsers'
import pkg from '@packages/root'
import { RunnablesStore } from '@packages/reporter'
import { ServerCt, SocketCt } from '@packages/server-ct'
import { SocketE2E } from './socket-e2e'
import api from './api'
import { Automation } from './automation'
import cache from './cache'
import config from './config'
import cwd from './cwd'
import errors from './errors'
import logger from './logger'
import Reporter from './reporter'
import runEvents from './plugins/run_events'
import savedState from './saved_state'
import scaffold from './scaffold'
import { ServerE2E } from './server-e2e'
import system from './util/system'
import user from './user'
import { ensureProp } from './util/class-helpers'
import { escapeFilenameInUrl } from './util/escape_filename'
import { fs } from './util/fs'
import keys from './util/keys'
import settings from './util/settings'
import plugins from './plugins'
import specsUtil from './util/specs'
import Watchers from './watchers'
import devServer from './plugins/dev-server'
import preprocessor from './plugins/preprocessor'
import { SpecsStore } from './specs-store'
import { createRoutes as createE2ERoutes } from './routes'
import { createRoutes as createCTRoutes } from '@packages/server-ct/src/routes-ct'
import { OpenServerOptions } from './server-base'

export type Cfg = Record<string, any>

const localCwd = cwd()
const multipleForwardSlashesRe = /[^:\/\/](\/{2,})/g
const backSlashesRe = /\\/g

const debug = Debug('cypress:server:project')
const debugScaffold = Debug('cypress:server:scaffold')

export class ProjectBase<TServer extends ServerE2E | ServerCt> extends EE {
  protected projectRoot: string
  protected watchers: Watchers
  protected options?: Record<string, any>
  protected _cfg?: Cfg
  protected _server?: TServer
  protected _automation?: Automation
  private generatedProjectIdTimestamp?: any
  private _recordTests?: (runnables: any, cb: any) => any

  public modifiedConfig: Cfg = {}
  public browser: any
  public projectType: 'e2e' | 'ct'
  public spec: Cypress.Cypress['spec'] | null

  constructor ({ projectRoot, projectType }: { projectRoot: string, projectType: 'ct' | 'e2e' }) {
    super()

    if (!projectRoot) {
      throw new Error('Instantiating lib/project requires a projectRoot!')
    }

    if (!check.unemptyString(projectRoot)) {
      throw new Error(`Expected project root path, not ${projectRoot}`)
    }

    this.projectType = projectType
    this.projectRoot = path.resolve(projectRoot)
    this.watchers = new Watchers()
    this.spec = null
    this.browser = null

    debug('Project created %o', {
      projectType: this.projectType,
      projectRoot: this.projectRoot,
    })
  }

  protected ensureProp = ensureProp

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

  injectCtSpecificConfig (cfg) {
    const rawJson = cfg.rawJson as Cfg

    return {
      ...cfg,
      viewportHeight: rawJson.viewportHeight ?? 500,
      viewportWidth: rawJson.viewportWidth ?? 500,
    }
  }

  async onOpen (cfg: Record<string, any> | undefined, options: OpenServerOptions) {
    this._server = (this.projectType === 'e2e'
      ? new ServerE2E()
      : new ServerCt()) as TServer

    await this._initPlugins(cfg, options)

    const { specsStore, startSpecWatcher } = await this.initializeSpecs()

    this.modifiedConfig = this.projectType === 'e2e'
      ? this.modifiedConfig
      : this.injectCtSpecificConfig(this.modifiedConfig)

    return this.server.open(this.modifiedConfig, {
      project: this,
      onError: options.onError,
      onWarning: options.onWarning,
      shouldCorrelatePreRequests: this.shouldCorrelatePreRequests,
      projectType: this.projectType,
      SocketCtor: this.projectType === 'e2e' ? SocketE2E : SocketCt,
      createRoutes: this.projectType === 'e2e' ? createE2ERoutes : createCTRoutes,
      specsStore,
    })
    .then(([port, warning]) => {
      return {
        cfg: this.modifiedConfig,
        port,
        warning,
        specsStore,
        startSpecWatcher,
      }
    })
  }

  onAfterOpen ({ cfg }) {
    cfg.proxyServer = cfg.proxyUrl

    return cfg
  }

  open (options: any = {}) {
    debug('opening project instance %s', this.projectRoot)
    debug('project open options %o', options)

    _.defaults(options, {
      report: false,
      onFocusTests () {},
      onError () {},
      onWarning () {},
      onSettingsChanged: false,
    })

    debug('project options %o', options)
    this.options = options

    return this.getConfig(options)
    .tap((cfg) => {
      process.chdir(this.projectRoot)

      // attach warning message if user has "chromeWebSecurity: false" for unsupported browser
      if (cfg.chromeWebSecurity === false) {
        _.chain(cfg.browsers)
        .filter((browser) => browser.family !== 'chromium')
        .each((browser) => browser.warning = errors.getMsgByType('CHROME_WEB_SECURITY_NOT_SUPPORTED', browser.name))
        .value()
      }

      // TODO: we currently always scaffold the plugins file
      // even when headlessly or else it will cause an error when
      // we try to load it and it's not there. We must do this here
      // else initialing the plugins will instantly fail.
      if (cfg.pluginsFile) {
        debug('scaffolding with plugins file %s', cfg.pluginsFile)

        return scaffold.plugins(path.dirname(cfg.pluginsFile), cfg)
      }
    })
    .then((cfg) => {
      return this.onOpen(cfg, options)
    })
    .tap(({ cfg, port }) => {
      // if we didnt have a cfg.port
      // then get the port once we
      // open the server
      if (!cfg.port) {
        cfg.port = port

        // and set all the urls again
        _.extend(cfg, config.setUrls(cfg))
      }
    })
    .tap(this.onAfterOpen)
    .then(({ cfg, port, warning, startSpecWatcher, specsStore }) => {
      // store the cfg from
      // opening the server
      this._cfg = cfg

      debug('project config: %o', _.omit(cfg, 'resolved'))

      if (warning) {
        options.onWarning(warning)
      }

      options.onSavedStateChanged = (state) => this.saveState(state)

      // save the last time they opened the project
      // along with the first time they opened it
      const now = Date.now()
      const stateToSave: any = {
        lastOpened: now,
      }

      if (!cfg.state || !cfg.state.firstOpened) {
        stateToSave.firstOpened = now
      }

      return Bluebird.join(
        this.watchSettingsAndStartWebsockets(options, cfg),
        this.scaffold(cfg),
        this.saveState(stateToSave),
      )
      .then(() => {
        // start watching specs
        // whenever a spec file is added or removed, we notify the
        // <SpecList>
        // This is only used for CT right now, but it will be
        // used for E2E eventually. Until then, do not watch
        // the specs.
        startSpecWatcher()

        return Bluebird.join(
          this.checkSupportFile(cfg),
          this.watchPluginsFile(cfg, options),
        )
      })
      .then(() => {
        if (cfg.isTextTerminal || !cfg.experimentalInteractiveRunEvents) return

        return system.info()
        .then((sys) => {
          const beforeRunDetails = {
            config: cfg,
            cypressVersion: pkg.version,
            system: _.pick(sys, 'osName', 'osVersion'),
          }

          return runEvents.execute('before:run', cfg, beforeRunDetails)
        })
      })
    })
    .return(this)
  }

  getRuns () {
    return Bluebird.all([
      this.getProjectId(),
      user.ensureAuthToken(),
    ])
    .spread((projectId, authToken) => {
      return api.getProjectRuns(projectId, authToken)
    })
  }

  reset () {
    debug('resetting project instance %s', this.projectRoot)

    this.spec = null
    this.browser = null

    return Bluebird.try(() => {
      if (this._automation) {
        this._automation.reset()
      }

      if (this._server) {
        return this._server.reset()
      }

      return
    })
  }

  close () {
    debug('closing project instance %s', this.projectRoot)

    this.spec = null
    this.browser = null

    const closePreprocessor = (this.projectType === 'e2e' && preprocessor.close) ?? undefined

    return Bluebird.join(
      this.server?.close(),
      this.watchers?.close(),
      closePreprocessor?.(),
    )
    .then(() => {
      process.chdir(localCwd)

      return this.getConfig()
    })
    .then((config) => {
      if (config.isTextTerminal || !config.experimentalInteractiveRunEvents) return

      return runEvents.execute('after:run', config)
    })
  }

  checkSupportFile (cfg) {
    const supportFile = cfg.supportFile

    if (supportFile) {
      return fs.pathExists(supportFile)
      .then((found) => {
        if (!found) {
          errors.throw('SUPPORT_FILE_NOT_FOUND', supportFile, settings.configFile(cfg))
        }
      })
    }

    return Bluebird.resolve()
  }

  _onError<Options extends Record<string, any>> (err: Error, options: Options) {
    debug('got plugins error', err.stack)

    browsers.close()

    options.onError(err)
  }

  _initPlugins (cfg, options) {
    // only init plugins with the
    // allowed config values to
    // prevent tampering with the
    // internals and breaking cypress
    const allowedCfg = config.allowed(cfg)

    return plugins.init(allowedCfg, {
      projectRoot: this.projectRoot,
      configFile: settings.pathToConfigFile(this.projectRoot, options),
      testingType: options.testingType,
      onError: (err: Error) => this._onError(err, options),
      onWarning: options.onWarning,
    })
    .then((modifiedCfg) => {
      debug('plugin config yielded: %o', modifiedCfg)

      const updatedConfig = config.updateWithPluginValues(cfg, modifiedCfg)

      this.modifiedConfig = updatedConfig

      if (this.projectType === 'ct') {
        updatedConfig.componentTesting = true

        // This value is normally set up in the `packages/server/lib/plugins/index.js#110`
        // But if we don't return it in the plugins function, it never gets set
        // Since there is no chance that it will have any other value here, we set it to "component"
        // This allows users to not return config in the `cypress/plugins/index.js` file
        // https://github.com/cypress-io/cypress/issues/16860
        updatedConfig.resolved.testingType = { value: 'component' }
      }

      debug('updated config: %o', this.modifiedConfig)

      return Bluebird.resolve(this.modifiedConfig)
    })
  }

  async initializeSpecs () {
    const specs = (await specsUtil.find(this.modifiedConfig)).filter((spec: Cypress.Cypress['spec']) => {
      if (this.projectType === 'ct') {
        return spec.specType === 'component'
      }

      if (this.projectType === 'e2e') {
        return spec.specType === 'integration'
      }

      throw Error(`Cannot return specType for projectType: ${this.projectType}`)
    })

    return this.initSpecStore({ specs })
  }

  async startCtDevServer (specs: Cypress.Cypress['spec'][], config: any) {
    // CT uses a dev-server to build the bundle.
    // We start the dev server here.
    const devServerOptions = await devServer.start({ specs, config })

    if (!devServerOptions) {
      throw new Error([
        'It looks like nothing was returned from on(\'dev-server:start\', {here}).',
        'Make sure that the dev-server:start function returns an object.',
        'For example: on("dev-server:start", () => startWebpackDevServer({ webpackConfig }))',
      ].join('\n'))
    }

    return { port: devServerOptions.port }
  }

  async initSpecStore ({
    specs,
  }: {
    specs: Cypress.Cypress['spec'][]
  }) {
    const specsStore = new SpecsStore(this.modifiedConfig, this.projectType)

    if (this.projectType === 'ct') {
      const { port } = await this.startCtDevServer(specs, this.modifiedConfig)

      this.modifiedConfig.baseUrl = `http://localhost:${port}`
    }

    const startSpecWatcher = () => {
      return specsStore.watch({
        onSpecsChanged: (specs) => {
        // both e2e and CT watch the specs and send them to the
        // client to be shown in the SpecList.
          this.server.sendSpecList(specs, this.projectType)

          if (this.projectType === 'ct') {
          // ct uses the dev-server to build and bundle the speces.
          // send new files to dev server
            devServer.updateSpecs(specs)
          }
        },
      })
    }

    return specsStore.storeSpecFiles()
    .return({
      specsStore,
      startSpecWatcher,
    })
  }

  watchPluginsFile (cfg, options) {
    debug(`attempt watch plugins file: ${cfg.pluginsFile}`)
    if (!cfg.pluginsFile || options.isTextTerminal) {
      return Bluebird.resolve()
    }

    return fs.pathExists(cfg.pluginsFile)
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
      this.watchers.watch(settings.pathToConfigFile(this.projectRoot, options), obj)
    }

    return this.watchers.watch(settings.pathToCypressEnvJson(this.projectRoot), obj)
  }

  watchSettingsAndStartWebsockets (options: Record<string, unknown> = {}, cfg: Record<string, any> = {}) {
    this.watchSettings(options.onSettingsChanged, options)

    const { projectRoot } = cfg
    let { reporter } = cfg as { reporter: RunnablesStore }

    // if we've passed down reporter
    // then record these via mocha reporter
    if (cfg.report) {
      try {
        Reporter.loadReporter(reporter, projectRoot)
      } catch (err) {
        const paths = Reporter.getSearchPathsForReporter(reporter, projectRoot)

        // only include the message if this is the standard MODULE_NOT_FOUND
        // else include the whole stack
        const errorMsg = err.code === 'MODULE_NOT_FOUND' ? err.message : err.stack

        errors.throw('INVALID_REPORTER_NAME', {
          paths,
          error: errorMsg,
          name: reporter,
        })
      }

      reporter = Reporter.create(reporter, cfg.reporterOptions, projectRoot)
    }

    const onBrowserPreRequest = (browserPreRequest) => {
      this.server.addBrowserPreRequest(browserPreRequest)
    }

    this._automation = new Automation(cfg.namespace, cfg.socketIoCookie, cfg.screenshotsFolder, onBrowserPreRequest)

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

      onTestsReceivedAndMaybeRecord: async (runnables, cb) => {
        debug('received runnables %o', runnables)

        if (reporter != null) {
          reporter.setRunnables(runnables)
        }

        if (this._recordTests) {
          await this._recordTests?.(runnables, cb)

          this._recordTests = undefined

          return
        }

        cb()
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
          return Bluebird.all([
            (reporter != null ? reporter.end() : undefined),
            this.server.end(),
          ])
          .spread((stats = {}) => {
            this.emit('end', stats)
          })
        }

        return
      },
    })
  }

  changeToUrl (url) {
    this.server.changeToUrl(url)
  }

  shouldCorrelatePreRequests = () => {
    if (!this.browser) {
      return false
    }

    const { family, majorVersion } = this.browser

    return family === 'chromium' || (family === 'firefox' && majorVersion >= 86)
  }

  setCurrentSpecAndBrowser (spec, browser: Cypress.Browser) {
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

  removeScaffoldedFiles () {
    if (!this.cfg) {
      throw new Error('Missing project config')
    }

    return scaffold.removeIntegration(this.cfg.integrationFolder, this.cfg)
  }

  // do not check files again and again - keep previous promise
  // to refresh it - just close and open the project again.
  determineIsNewProject (folder) {
    return scaffold.isNewProject(folder)
  }

  // returns project config (user settings + defaults + cypress.json)
  // with additional object "state" which are transient things like
  // window width and height, DevTools open or not, etc.
  getConfig (options: any = {}): Bluebird<Cfg> {
    if (options == null) {
      options = this.options
    }

    if (this._cfg) {
      debug('project has config %o', this._cfg)

      return Bluebird.resolve(this._cfg)
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

      return this.determineIsNewProject(cfg)
      .then((untouchedScaffold) => {
        const userHasSeenBanner = _.get(cfg, 'state.showedNewProjectBanner', false)

        debugScaffold(`untouched scaffold ${untouchedScaffold} banner closed ${userHasSeenBanner}`)
        cfg.isNewProject = untouchedScaffold && !userHasSeenBanner
      })
    }

    return config.get(this.projectRoot, options)
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

    const newState = _.merge({}, this.cfg.state, stateChanges)

    return savedState.create(this.projectRoot, this.cfg.isTextTerminal)
    .then((state) => state.set(newState))
    .then(() => {
      this.cfg.state = newState

      return newState
    })
  }

  _setSavedState (cfg) {
    debug('get saved state')

    return savedState.create(this.projectRoot, cfg.isTextTerminal)
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
    const url = `/${path.join(type, path.relative(
      folderToUse,
      path.resolve(projectRoot, pathToSpec),
    )).replace(backSlashesRe, '/')}`

    debug('prefixed path for spec %o', { pathToSpec, type, url })

    return url
  }

  normalizeSpecUrl (browserUrl, specUrl) {
    const replacer = (match) => match.replace('//', '/')

    return [
      browserUrl,
      '#/tests',
      escapeFilenameInUrl(specUrl),
    ].join('/')
    .replace(multipleForwardSlashesRe, replacer)
  }

  scaffold (cfg: Cfg) {
    debug('scaffolding project %s', this.projectRoot)

    const scaffolds = []

    const push = scaffolds.push.bind(scaffolds) as (...args: any[]) => number

    // TODO: we are currently always scaffolding support
    // even when headlessly - this is due to a major breaking
    // change of 0.18.0
    // we can later force this not to always happen when most
    // of our users go beyond 0.18.0
    //
    // ensure support dir is created
    // and example support file if dir doesnt exist
    push(scaffold.support(cfg.supportFolder, cfg))

    // if we're in headed mode add these other scaffolding tasks
    debug('scaffold flags %o', {
      isTextTerminal: cfg.isTextTerminal,
      CYPRESS_INTERNAL_FORCE_SCAFFOLD: process.env.CYPRESS_INTERNAL_FORCE_SCAFFOLD,
    })

    const scaffoldExamples = !cfg.isTextTerminal || process.env.CYPRESS_INTERNAL_FORCE_SCAFFOLD

    if (scaffoldExamples) {
      debug('will scaffold integration and fixtures folder')
      push(scaffold.integration(cfg.integrationFolder, cfg))
      push(scaffold.fixture(cfg.fixturesFolder, cfg))
    } else {
      debug('will not scaffold integration or fixtures folder')
    }

    return Bluebird.all(scaffolds)
  }

  writeProjectId (id) {
    const attrs = { projectId: id }

    logger.info('Writing Project ID', _.clone(attrs))

    this.generatedProjectIdTimestamp = new Date()

    return settings
    .write(this.projectRoot, attrs)
    .return(id)
  }

  getProjectId () {
    return this.verifyExistence()
    .then(() => {
      return settings.read(this.projectRoot, this.options)
    })
    .then((readSettings) => {
      if (readSettings && readSettings.projectId) {
        return readSettings.projectId
      }

      errors.throw('NO_PROJECT_ID', settings.configFile(this.options), this.projectRoot)
    })
  }

  verifyExistence () {
    return fs
    .statAsync(this.projectRoot)
    .return(this)
    .catch(() => {
      errors.throw('NO_PROJECT_FOUND_AT_PROJECT_ROOT', this.projectRoot)
    })
  }

  createCiProject (projectDetails) {
    debug('create CI project with projectDetails %o', projectDetails)

    return user.ensureAuthToken()
    .then((authToken) => {
      const remoteOrigin = commitInfo.getRemoteOrigin(this.projectRoot)

      debug('found remote origin at projectRoot %o', {
        remoteOrigin,
        projectRoot: this.projectRoot,
      })

      return remoteOrigin
      .then((remoteOrigin) => {
        return api.createProject(projectDetails, remoteOrigin, authToken)
      })
    }).then((newProject) => {
      return this.writeProjectId(newProject.id)
      .return(newProject)
    })
  }

  getRecordKeys () {
    return Bluebird.all([
      this.getProjectId(),
      user.ensureAuthToken(),
    ])
    .spread((projectId, authToken) => {
      return api.getProjectRecordKeys(projectId, authToken)
    })
  }

  requestAccess (projectId) {
    return user.ensureAuthToken()
    .then((authToken) => {
      return api.requestAccess(projectId, authToken)
    })
  }

  static getOrgs () {
    return user.ensureAuthToken()
    .then((authToken) => {
      return api.getOrgs(authToken)
    })
  }

  static paths () {
    return cache.getProjectRoots()
  }

  static getPathsAndIds () {
    return cache.getProjectRoots()
    // this assumes that the configFile for a cached project is 'cypress.json'
    // https://git.io/JeGyF
    .map((projectRoot) => {
      return Bluebird.props({
        path: projectRoot,
        id: settings.id(projectRoot),
      })
    })
  }

  static getDashboardProjects () {
    return user.ensureAuthToken()
    .then((authToken) => {
      debug('got auth token: %o', { authToken: keys.hide(authToken) })

      return api.getProjects(authToken)
    })
  }

  static _mergeDetails (clientProject, project) {
    return _.extend({}, clientProject, project, { state: 'VALID' })
  }

  static _mergeState (clientProject, state) {
    return _.extend({}, clientProject, { state })
  }

  static _getProject (clientProject, authToken) {
    debug('get project from api', clientProject.id, clientProject.path)

    return api.getProject(clientProject.id, authToken)
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

    return user.ensureAuthToken()
    .then((authToken) => {
      debug('got auth token: %o', { authToken: keys.hide(authToken) })

      return api.getProjects(authToken).then((projects = []) => {
        debug(`got ${projects.length} projects`)
        const projectsIndex = _.keyBy(projects, 'id')

        return Bluebird.all(_.map(clientProjects, (clientProject: any) => {
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

      return Bluebird.resolve(ProjectBase._mergeState(clientProject, 'VALID'))
    }

    return user.ensureAuthToken().then((authToken) => {
      debug('got auth token: %o', { authToken: keys.hide(authToken) })

      return ProjectBase._getProject(clientProject, authToken)
    })
  }

  static remove (path) {
    return cache.removeProject(path)
  }

  static add (path, options) {
    // don't cache a project if a non-default configFile is set
    // https://git.io/JeGyF
    if (settings.configFile(options) !== 'cypress.json') {
      return Bluebird.resolve({ path })
    }

    return cache.insertProject(path)
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
    return new ProjectBase({ projectRoot: path, projectType: 'e2e' }).getProjectId()
  }

  static ensureExists (path, options) {
    // is there a configFile? is the root writable?
    return settings.exists(path, options)
  }

  static config (path) {
    return new ProjectBase({ projectRoot: path, projectType: 'e2e' }).getConfig()
  }
}
