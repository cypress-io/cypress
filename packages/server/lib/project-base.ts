import check from 'check-more-types'
import Debug from 'debug'
import EE from 'events'
import _ from 'lodash'
import path from 'path'
import { createHmac } from 'crypto'

import browsers from './browsers'
import pkg from '@packages/root'
import { ServerCt } from './server-ct'
import { SocketCt } from './socket-ct'
import { SocketE2E } from './socket-e2e'
import { Automation } from './automation'
import cwd from './cwd'
import errors from './errors'
import Reporter from './reporter'
import runEvents from './plugins/run_events'
import { ServerE2E } from './server-e2e'
import system from './util/system'
import { ensureProp } from './util/class-helpers'
import specsUtil from './util/specs'
import Watchers from './watchers'
import devServer from './plugins/dev-server'
import preprocessor from './plugins/preprocessor'
import { SpecsStore } from './specs-store'
import type { OpenProjectLaunchOptions } from '@packages/types'
import type { DataContext } from '@packages/data-context'
import assert from 'assert'

// Cannot just use RuntimeConfigOptions as is because some types are not complete.
// Instead, this is an interface of values that have been manually validated to exist
// and are required when creating a project.
type ReceivedCypressOptions =
  Pick<Cypress.RuntimeConfigOptions, 'hosts' | 'projectName' | 'clientRoute' | 'devServerPublicPathRoute' | 'namespace' | 'report' | 'socketIoCookie' | 'configFile' | 'isTextTerminal' | 'proxyUrl' | 'browsers' | 'browserUrl' | 'socketIoRoute' | 'arch' | 'platform' | 'spec' | 'specs' | 'browser' | 'version' | 'remote'>
  & Pick<Cypress.ResolvedConfigOptions, 'chromeWebSecurity' | 'supportFolder' | 'experimentalSourceRewriting' | 'fixturesFolder' | 'reporter' | 'reporterOptions' | 'screenshotsFolder' | 'supportFile' | 'integrationFolder' | 'baseUrl' | 'viewportHeight' | 'viewportWidth' | 'port' | 'experimentalInteractiveRunEvents' | 'componentFolder' | 'userAgent' | 'downloadsFolder' | 'env' | 'testFiles' | 'ignoreTestFiles'> // TODO: Figure out how to type this better.

export interface Cfg extends ReceivedCypressOptions {
  projectRoot: string
  proxyServer?: Cypress.RuntimeConfigOptions['proxyUrl']
  exit?: boolean
  state?: {
    firstOpened?: number | null
    lastOpened?: number | null
  }
}

const localCwd = cwd()

const debug = Debug('cypress:server:project')

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
    ctx,
    projectRoot,
    testingType,
    options = {},
  }: {
    ctx: DataContext
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
    this.ctx = ctx

    debug('Project created %o', {
      testingType: this.testingType,
      projectRoot: this.projectRoot,
    })

    this.options = {
      report: false,
      onError () {},
      onWarning () {},
      onSettingsChanged: false,
      ...options,
    }
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

  createServer (testingType: Cypress.TestingType) {
    return testingType === 'e2e'
      ? new ServerE2E(this.ctx) as TServer
      : new ServerCt(this.ctx) as TServer
  }

  async open () {
    assert(this.ctx.actions.currentProject, 'Expected actions.currentProject in projectBase.open')
    debug('opening project instance %s', this.projectRoot)
    debug('project open options %o', this.options)

    let cfg = this.getConfig()

    process.chdir(this.projectRoot)

    this._server = this.createServer(this.testingType)

    if (!this.options.skipPluginIntializeForTesting) {
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

    this.ctx.actions.projectConfig?.updateFromServerStart()

    // store the cfg from
    // opening the server
    this._cfg = cfg

    debug('project config: %o', _.omit(cfg, 'resolved'))

    if (warning) {
      this.options.onWarning(warning)
    }

    this.startWebsockets({
      onFocusTests: this.options.onFocusTests,
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
      this.saveState(stateToSave),
    ])

    // checkSupportFile
    // throw errors.get('SUPPORT_FILE_NOT_FOUND', supportFile, settings.configFile({ configFile }))

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

    assert(this.ctx.actions.projectConfig, 'expected projectConfig in ProjectBase.open')

    return this.ctx.actions.projectConfig.execute('before:run', cfg, beforeRunDetails)
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

  getConfig () {
    return this.ctx.projectConfig.settingsRead()
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

    if (this.testingType === 'component' && !this.options.skipPluginIntializeForTesting) {
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

      throw errors.get('INVALID_REPORTER_NAME', {
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
      onFocusTests: options.onFocusTests,
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

  saveState (state: object) {
    return this.ctx.actions.currentProject?.saveState(state)
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

  getAutomation () {
    return this.automation
  }
}
