import check from 'check-more-types'
import Debug from 'debug'
import EE from 'events'
import _ from 'lodash'
import path from 'path'
import { createHmac } from 'crypto'

import browsers from './browsers'
import pkg from '@packages/root'
import { allowed } from '@packages/config'
import { ServerCt } from './server-ct'
import { SocketCt } from './socket-ct'
import { SocketE2E } from './socket-e2e'
import { Automation } from './automation'
import * as config from './config'
import cwd from './cwd'
import errors from './errors'
import Reporter from './reporter'
import runEvents from './plugins/run_events'
import * as savedState from './saved_state'
import scaffold from './scaffold'
import { ServerE2E } from './server-e2e'
import system from './util/system'
import { ensureProp } from './util/class-helpers'
import { fs } from './util/fs'
import * as settings from './util/settings'
import plugins from './plugins'
import specsUtil from './util/specs'
import Watchers from './watchers'
import devServer from './plugins/dev-server'
import preprocessor from './plugins/preprocessor'
import { SpecsStore } from './specs-store'
import { checkSupportFile, getDefaultConfigFilePath } from './project_utils'
import type { FoundBrowser, OpenProjectLaunchOptions } from '@packages/types'
import { DataContext, getCtx } from '@packages/data-context'

// Cannot just use RuntimeConfigOptions as is because some types are not complete.
// Instead, this is an interface of values that have been manually validated to exist
// and are required when creating a project.
type ReceivedCypressOptions =
  Pick<Cypress.RuntimeConfigOptions, 'hosts' | 'projectName' | 'clientRoute' | 'devServerPublicPathRoute' | 'namespace' | 'report' | 'socketIoCookie' | 'configFile' | 'isTextTerminal' | 'isNewProject' | 'proxyUrl' | 'browsers' | 'browserUrl' | 'socketIoRoute' | 'arch' | 'platform' | 'spec' | 'specs' | 'browser' | 'version' | 'remote'>
  & Pick<Cypress.ResolvedConfigOptions, 'chromeWebSecurity' | 'supportFolder' | 'experimentalSourceRewriting' | 'fixturesFolder' | 'reporter' | 'reporterOptions' | 'screenshotsFolder' | 'pluginsFile' | 'supportFile' | 'integrationFolder' | 'baseUrl' | 'viewportHeight' | 'viewportWidth' | 'port' | 'experimentalInteractiveRunEvents' | 'componentFolder' | 'userAgent' | 'downloadsFolder' | 'env' | 'testFiles' | 'ignoreTestFiles'> // TODO: Figure out how to type this better.

export interface Cfg extends ReceivedCypressOptions {
  projectRoot: string
  proxyServer?: Cypress.RuntimeConfigOptions['proxyUrl']
  exit?: boolean
  state?: {
    firstOpened?: number | null
    lastOpened?: number | null
    promptsShown?: object | null
  }
}

const localCwd = cwd()

const debug = Debug('cypress:server:project')
const debugScaffold = Debug('cypress:server:scaffold')

type StartWebsocketOptions = Pick<Cfg, 'socketIoCookie' | 'namespace' | 'screenshotsFolder' | 'report' | 'reporter' | 'reporterOptions' | 'projectRoot'>

export type Server = ServerE2E | ServerCt

export class ProjectBase<TServer extends Server> extends EE {
  // id is sha256 of projectRoot
  public id: string

  protected watchers: Watchers
  protected ctx: DataContext
  protected _cfg?: Cfg
  protected _server?: TServer
  protected _automation?: Automation
  private _recordTests?: any = null
  private _isServerOpen: boolean = false

  public browser: any
  public options: OpenProjectLaunchOptions
  public testingType: Cypress.TestingType
  public spec: Cypress.Cypress['spec'] | null
  public isOpen: boolean = false
  private generatedProjectIdTimestamp: any
  projectRoot: string

  constructor ({
    projectRoot,
    testingType,
    options = {},
  }: {
    projectRoot: string
    testingType: Cypress.TestingType
    options: OpenProjectLaunchOptions
  }) {
    super()

    if (!projectRoot) {
      throw new Error('Instantiating lib/project requires a projectRoot!')
    }

    if (!check.unemptyString(projectRoot)) {
      throw new Error(`Expected project root path, not ${projectRoot}`)
    }

    this.testingType = testingType
    this.projectRoot = path.resolve(projectRoot)
    this.watchers = new Watchers()
    this.spec = null
    this.browser = null
    this.id = createHmac('sha256', 'secret-key').update(projectRoot).digest('hex')
    this.ctx = getCtx()

    debug('Project created %o', {
      testingType: this.testingType,
      projectRoot: this.projectRoot,
    })

    this.options = {
      report: false,
      onFocusTests () {},
      onError () {},
      onWarning () {},
      onSettingsChanged: false,
      ...options,
    }

    this.ctx.actions.projectConfig.killConfigProcess()
    this.ctx.actions.project.setCurrentProjectProperties({
      projectRoot: this.projectRoot,
      configChildProcess: null,
      ctPluginsInitialized: false,
      e2ePluginsInitialized: false,
      isCTConfigured: false,
      isE2EConfigured: false,
      config: null,
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
    return this._cfg!
  }

  get state () {
    return this.cfg.state
  }

  injectCtSpecificConfig (cfg) {
    cfg.resolved.testingType = { value: 'component' }

    // This value is normally set up in the `packages/server/lib/plugins/index.js#110`
    // But if we don't return it in the plugins function, it never gets set
    // Since there is no chance that it will have any other value here, we set it to "component"
    // This allows users to not return config in the `cypress/plugins/index.js` file
    // https://github.com/cypress-io/cypress/issues/16860
    const rawJson = cfg.rawJson as Cfg

    return {
      ...cfg,
      componentTesting: true,
      viewportHeight: rawJson.viewportHeight ?? 500,
      viewportWidth: rawJson.viewportWidth ?? 500,
    }
  }

  createServer (testingType: Cypress.TestingType) {
    return testingType === 'e2e'
      ? new ServerE2E(this.ctx) as TServer
      : new ServerCt(this.ctx) as TServer
  }

  async open () {
    debug('opening project instance %s', this.projectRoot)
    debug('project open options %o', this.options)

    let cfg = this.getConfig()

    process.chdir(this.projectRoot)

    // TODO: we currently always scaffold the plugins file
    // even when headlessly or else it will cause an error when
    // we try to load it and it's not there. We must do this here
    // else initialing the plugins will instantly fail.
    if (cfg.pluginsFile) {
      debug('scaffolding with plugins file %s', cfg.pluginsFile)

      await scaffold.plugins(path.dirname(cfg.pluginsFile), cfg)
    }

    this._server = this.createServer(this.testingType)

    if (!this.options.skipPluginInitializeForTesting) {
      cfg = await this.initializePlugins(cfg, this.options)
    }

    const {
      specsStore,
      startSpecWatcher,
      ctDevServerPort,
    } = await this.initializeSpecStore(cfg)

    if (this.testingType === 'component') {
      cfg.baseUrl = `http://localhost:${ctDevServerPort}`
    }

    const [port, warning] = await this._server.open(cfg, {
      getCurrentBrowser: () => this.browser,
      getSpec: () => this.spec,
      exit: this.options.args?.exit,
      onError: this.options.onError,
      onWarning: this.options.onWarning,
      shouldCorrelatePreRequests: this.shouldCorrelatePreRequests,
      testingType: this.testingType,
      SocketCtor: this.testingType === 'e2e' ? SocketE2E : SocketCt,
      specsStore,
    })

    this.ctx.setAppServerPort(port)
    this._isServerOpen = true

    // if we didnt have a cfg.port
    // then get the port once we
    // open the server
    if (!cfg.port) {
      cfg.port = port

      // and set all the urls again
      _.extend(cfg, config.setUrls(cfg))
    }

    cfg.proxyServer = cfg.proxyUrl

    // store the cfg from
    // opening the server
    this._cfg = cfg

    debug('project config: %o', _.omit(cfg, 'resolved'))

    if (warning) {
      this.options.onWarning(warning)
    }

    // save the last time they opened the project
    // along with the first time they opened it
    const now = Date.now()
    const stateToSave = {
      lastOpened: now,
    } as any

    if (!cfg.state || !cfg.state.firstOpened) {
      stateToSave.firstOpened = now
    }

    this.watchSettings({
      onSettingsChanged: this.options.onSettingsChanged,
      projectRoot: this.projectRoot,
      configFile: this.options.configFile,
    })

    this.startWebsockets({
      onReloadBrowser: this.options.onReloadBrowser,
      onFocusTests: this.options.onFocusTests,
      onSpecChanged: this.options.onSpecChanged,
    }, {
      socketIoCookie: cfg.socketIoCookie,
      namespace: cfg.namespace,
      screenshotsFolder: cfg.screenshotsFolder,
      report: cfg.report,
      reporter: cfg.reporter,
      reporterOptions: cfg.reporterOptions,
      projectRoot: this.projectRoot,
    })

    await Promise.all([
      this.scaffold(cfg),
      this.saveState(stateToSave),
    ])

    await Promise.all([
      checkSupportFile({ configFile: cfg.configFile, supportFile: cfg.supportFile }),
      this.watchPluginsFile(cfg, this.options),
    ])

    if (cfg.isTextTerminal) {
      return
    }

    // start watching specs
    // whenever a spec file is added or removed, we notify the
    // <SpecList>
    // This is only used for CT right now by general users.
    // It is is used with E2E if the CypressInternal_UseInlineSpecList flag is true.
    startSpecWatcher()

    if (!cfg.experimentalInteractiveRunEvents) {
      return
    }

    const sys = await system.info()
    const beforeRunDetails = {
      config: cfg,
      cypressVersion: pkg.version,
      system: _.pick(sys, 'osName', 'osVersion'),
    }

    this.isOpen = true

    return runEvents.execute('before:run', cfg, beforeRunDetails)
  }

  reset () {
    debug('resetting project instance %s', this.projectRoot)

    this.spec = null
    this.browser = null

    if (this._automation) {
      this._automation.reset()
    }

    if (this._server) {
      return this._server.reset()
    }

    return
  }

  async close () {
    debug('closing project instance %s', this.projectRoot)

    this.spec = null
    this.browser = null

    if (!this._isServerOpen) {
      return
    }

    const closePreprocessor = this.testingType === 'e2e' ? preprocessor.close : undefined

    this.ctx.setAppServerPort(undefined)
    this.ctx.setAppSocketServer(undefined)

    await Promise.all([
      this.server?.close(),
      this.watchers?.close(),
      closePreprocessor?.(),
    ])

    this._isServerOpen = false

    process.chdir(localCwd)
    this.isOpen = false

    const config = this.getConfig()

    if (config.isTextTerminal || !config.experimentalInteractiveRunEvents) return

    return runEvents.execute('after:run', config)
  }

  _onError<Options extends Record<string, any>> (err: Error, options: Options) {
    debug('got plugins error', err.stack)

    browsers.close()

    options.onError(err)
  }

  async initializeSpecStore (updatedConfig: Cfg): Promise<{
    specsStore: SpecsStore
    ctDevServerPort: number | undefined
    startSpecWatcher: () => void
  }> {
    const allSpecs = await specsUtil.findSpecs({
      projectRoot: updatedConfig.projectRoot,
      fixturesFolder: updatedConfig.fixturesFolder,
      supportFile: updatedConfig.supportFile,
      testFiles: updatedConfig.testFiles,
      ignoreTestFiles: updatedConfig.ignoreTestFiles,
      componentFolder: updatedConfig.componentFolder,
      integrationFolder: updatedConfig.integrationFolder,
    })
    const specs = allSpecs.filter((spec: Cypress.Cypress['spec']) => {
      if (this.testingType === 'component') {
        return spec.specType === 'component'
      }

      if (this.testingType === 'e2e') {
        return spec.specType === 'integration'
      }

      throw Error(`Cannot return specType for testingType: ${this.testingType}`)
    })

    return this.initSpecStore({ specs, config: updatedConfig })
  }

  // TODO(tim): Improve this when we completely overhaul the rest of the code here,
  async initializePlugins (cfg = this._cfg, options = this.options) {
    // only init plugins with the
    // allowed config values to
    // prevent tampering with the
    // internals and breaking cypress
    const allowedCfg = allowed(cfg)

    const modifiedCfg = await plugins.init(allowedCfg, {
      projectRoot: this.projectRoot,
      configFile: settings.pathToConfigFile(this.projectRoot, options),
      testingType: options.testingType,
      onError: (err: Error) => this._onError(err, options),
      onWarning: options.onWarning,
    }, this.ctx)

    debug('plugin config yielded: %o', modifiedCfg)

    return config.updateWithPluginValues(cfg, modifiedCfg)
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
    config,
  }: {
    specs: Cypress.Cypress['spec'][]
    config: Cfg
  }) {
    const specsStore = new SpecsStore(config, this.testingType)

    const startSpecWatcher = () => {
      return specsStore.watch({
        onSpecsChanged: (specs) => {
        // both e2e and CT watch the specs and send them to the
        // client to be shown in the SpecList.
          this.server.sendSpecList(specs, this.testingType)

          if (this.testingType === 'component') {
          // ct uses the dev-server to build and bundle the speces.
          // send new files to dev server
            devServer.updateSpecs(specs)
          }
        },
      })
    }

    let ctDevServerPort: number | undefined

    if (this.testingType === 'component' && !this.options.skipPluginInitializeForTesting) {
      const { port } = await this.startCtDevServer(specs, config)

      ctDevServerPort = port
    }

    return specsStore.storeSpecFiles()
    .return({
      specsStore,
      ctDevServerPort,
      startSpecWatcher,
    })
  }

  async watchPluginsFile (cfg, options) {
    debug(`attempt watch plugins file: ${cfg.pluginsFile}`)
    if (!cfg.pluginsFile || options.isTextTerminal) {
      return Promise.resolve()
    }

    // TODO(tim): remove this when we properly clean all of this up
    if (options) {
      this.options = options
    }

    const found = await fs.pathExists(cfg.pluginsFile)

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
        this.initializePlugins(cfg)
        .catch((err) => {
          options.onError(err)
        })
      },
    })
  }

  watchSettings ({
    onSettingsChanged,
    configFile,
    projectRoot,
  }: {
    projectRoot: string
    configFile?: string | false
    onSettingsChanged?: false | (() => void)
  }) {
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
        onSettingsChanged()
      },
    }

    if (configFile !== false) {
      this.watchers.watchTree(settings.pathToConfigFile(projectRoot, { configFile }), obj)
    }

    return this.watchers.watch(settings.pathToCypressEnvJson(projectRoot), obj)
  }

  initializeReporter ({
    report,
    reporter,
    projectRoot,
    reporterOptions,
  }: Pick<Cfg, 'report' | 'reporter' | 'projectRoot' | 'reporterOptions'>) {
    if (!report) {
      return
    }

    try {
      Reporter.loadReporter(reporter, projectRoot)
    } catch (err: any) {
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

    return Reporter.create(reporter, reporterOptions, projectRoot)
  }

  startWebsockets (options: Omit<OpenProjectLaunchOptions, 'args'>, { socketIoCookie, namespace, screenshotsFolder, report, reporter, reporterOptions, projectRoot }: StartWebsocketOptions) {
  // if we've passed down reporter
  // then record these via mocha reporter
    const reporterInstance = this.initializeReporter({
      report,
      reporter,
      reporterOptions,
      projectRoot,
    })

    const onBrowserPreRequest = (browserPreRequest) => {
      this.server.addBrowserPreRequest(browserPreRequest)
    }

    const onRequestEvent = (eventName, data) => {
      this.server.emitRequestEvent(eventName, data)
    }

    this._automation = new Automation(namespace, socketIoCookie, screenshotsFolder, onBrowserPreRequest, onRequestEvent)

    const io = this.server.startWebsockets(this.automation, this.cfg, {
      onReloadBrowser: options.onReloadBrowser,
      onFocusTests: options.onFocusTests,
      onSpecChanged: options.onSpecChanged,
      onSavedStateChanged: (state: any) => this.saveState(state),

      onCaptureVideoFrames: (data: any) => {
        // TODO: move this to browser automation middleware
        this.emit('capture:video:frames', data)
      },

      onConnect: (id: string) => {
        debug('socket:connected')
        this.emit('socket:connected', id)
      },

      onTestsReceivedAndMaybeRecord: async (runnables: unknown[], cb: () => void) => {
        debug('received runnables %o', runnables)

        if (reporterInstance) {
          reporterInstance.setRunnables(runnables)
        }

        if (this._recordTests) {
          await this._recordTests?.(runnables, cb)

          this._recordTests = null

          return
        }

        cb()
      },

      onMocha: async (event, runnable) => {
        debug('onMocha', event)
        // bail if we dont have a
        // reporter instance
        if (!reporterInstance) {
          return
        }

        reporterInstance.emit(event, runnable)

        if (event === 'end') {
          const [stats = {}] = await Promise.all([
            (reporterInstance != null ? reporterInstance.end() : undefined),
            this.server.end(),
          ])

          this.emit('end', stats)
        }

        return
      },
    })

    this.ctx.setAppSocketServer(io)
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

  async setBrowsers (browsers = []) {
    debug('getting config before setting browsers %o', browsers)

    const cfg = this.getConfig()

    debug('setting config browsers to %o', browsers)

    cfg.browsers = browsers
  }

  getAutomation () {
    return this.automation
  }

  async initializeConfig (browsers: FoundBrowser[] = []): Promise<Cfg> {
    // set default for "configFile" if undefined
    if (this.options.configFile === undefined || this.options.configFile === null) {
      this.options.configFile = await getDefaultConfigFilePath(this.projectRoot)
    }

    let theCfg: Cfg = await config.get(this.projectRoot, this.options)

    if (!theCfg.browsers || theCfg.browsers.length === 0) {
      // @ts-ignore - we don't know if the browser is headed or headless at this point.
      // this is handled in open_project#launch.
      theCfg.browsers = browsers
    }

    if (theCfg.browsers) {
      theCfg.browsers = theCfg.browsers?.map((browser) => {
        if (browser.family === 'chromium' || theCfg.chromeWebSecurity) {
          return browser
        }

        return {
          ...browser,
          warning: browser.warning || errors.getMsgByType('CHROME_WEB_SECURITY_NOT_SUPPORTED', browser.name),
        }
      })
    }

    theCfg = this.testingType === 'e2e'
      ? theCfg
      : this.injectCtSpecificConfig(theCfg)

    if (theCfg.isTextTerminal) {
      this._cfg = theCfg

      return this._cfg
    }

    // decide if new project by asking scaffold
    // and looking at previously saved user state
    if (!theCfg.integrationFolder) {
      throw new Error('Missing integration folder')
    }

    const untouchedScaffold = await this.determineIsNewProject(theCfg)

    debugScaffold(`untouched scaffold ${untouchedScaffold} banner closed`)
    theCfg.isNewProject = untouchedScaffold

    const cfgWithSaved = await this._setSavedState(theCfg)

    this._cfg = cfgWithSaved

    return this._cfg
  }

  // returns project config (user settings + defaults + cypress.config.{ts|js})
  // with additional object "state" which are transient things like
  // window width and height, DevTools open or not, etc.
  getConfig (): Cfg {
    if (!this._cfg) {
      throw Error('Must call #initializeConfig before accessing config.')
    }

    debug('project has config %o', this._cfg)

    return this._cfg
  }

  // Saved state

  // forces saving of project's state by first merging with argument
  async saveState (stateChanges = {}) {
    if (!this.cfg) {
      throw new Error('Missing project config')
    }

    if (!this.projectRoot) {
      throw new Error('Missing project root')
    }

    let state = await savedState.create(this.projectRoot, this.cfg.isTextTerminal)

    state.set(stateChanges)
    this.cfg.state = await state.get()

    return this.cfg.state
  }

  async _setSavedState (cfg: Cfg) {
    debug('get saved state')

    const state = await savedState.create(this.projectRoot, cfg.isTextTerminal)

    cfg.state = await state.get()

    return cfg
  }

  // do not check files again and again - keep previous promise
  // to refresh it - just close and open the project again.
  determineIsNewProject (folder) {
    return scaffold.isNewProject(folder)
  }

  writeConfigFile ({ code, configFilename }: { code: string, configFilename: string }) {
    fs.writeFileSync(path.resolve(this.projectRoot, configFilename), code)
  }

  scaffold (cfg: Cfg) {
    debug('scaffolding project %s', this.projectRoot)

    const scaffolds = []

    const push = scaffolds.push.bind(scaffolds) as any

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
      if (!process.env.LAUNCHPAD) {
        push(scaffold.integration(cfg.integrationFolder, cfg))
      }

      push(scaffold.fixture(cfg.fixturesFolder, cfg))
    } else {
      debug('will not scaffold integration or fixtures folder')
    }

    return Promise.all(scaffolds)
  }

  // These methods are not related to start server/sockets/runners

  async getProjectId () {
    await this.verifyExistence()

    const readSettings = await settings.read(this.projectRoot, this.options)

    if (readSettings && readSettings.projectId) {
      return readSettings.projectId
    }

    throw errors.throw('NO_PROJECT_ID', settings.configFile(this.options), this.projectRoot)
  }

  async verifyExistence () {
    try {
      await fs.statAsync(this.projectRoot)
    } catch (err) {
      errors.throw('NO_PROJECT_FOUND_AT_PROJECT_ROOT', this.projectRoot)
    }
  }

  // For testing
  // Do not use this method outside of testing
  // pass all your options when you create a new instance!
  __setOptions (options: OpenProjectLaunchOptions) {
    this.options = options
  }

  __setConfig (cfg: Cfg) {
    this._cfg = cfg
  }
}
