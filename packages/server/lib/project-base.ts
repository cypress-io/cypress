import { RunnerType } from "./specs-store"
import config from './config'
import { Automation } from './automation'
import { ServerBase } from "./server-base"
import { getPrefixedPathToSpec, normalizeSpecUrl } from "./project_utils"
import { ServerE2E } from "./server-e2e"
import { ServerCt, SocketCt } from "../../server-ct"
import { SocketE2E } from "./socket-e2e"
import EE from 'events'
import { createRoutes as createE2ERoutes } from './routes'
import { createRoutes as createCTRoutes } from '@packages/server-ct/src/routes-ct'
import plugins from './plugins'
import settings from './util/settings'
import savedState from './saved_state'
import preprocessor from './plugins/preprocessor'
import Watchers from './watchers'
import cwd from './cwd'
import runEvents from './plugins/run_events'
import { fs } from './util/fs'
import Debug from 'debug'
import { RootRunnable} from '@packages/reporter'
import Reporter from './reporter'
import errors from './errors'

const debug = Debug('cypress:server:project')

const localCwd = cwd()

export interface Cfg {
  reporter: 'dot' | 'spec' | string

  report: boolean

  // many other keys also exist.
  // if you find one that isn't listed here, please add it.
  [key: string]: any
}

export type TestingType = 'e2e' | 'component'

export interface Opts {
  onError: (error: Error) => void

  // many other keys also exist.
  // if you find one that isn't listed here, please add it.
  [key: string]: any
}

type RecordTests = (runnables: any, cb: () => void) => Promise<void>

export class ProjectBase extends EE {
  projectType: RunnerType
  projectRoot: string
  /**
   * Initial options passed when launching Cypress
   * It's a large and complex object with lots of useful information.
   */
  options: Opts

  private _config: Cfg | undefined
  /**
   * current spec that is selected
   */
  spec?: Cypress.Cypress['spec']

  /**
   * browser that will be used for the run or interactive session
   */

  browser?: Cypress.Browser

  /**
   * CDP
   */
  _automation?: Automation

  /**
   * current server used to server specs and handle network layer stubs
   */
   _server?: ServerBase<any>

   /**
    * The port the server is opened on.
    */
   _port?: number

  /**
   * Used to watch 
   * - the specs to show in the desktop GUI
   * - plugins file
   * - config file (cypress.json by default)
   * 
   * Must be initialized by calling `initializeWatchers`
   */
  private _watchers?: Watchers

  private _reporter?: typeof Reporter

  /**
   * callback to record tests if the user provides a projectId
   */
  private _recordTests?: RecordTests

  constructor({ projectType, projectRoot, options }: { projectType: RunnerType, projectRoot: string, options: Opts }) {
    super()

    this._watchers = new Watchers()
    this.projectType = projectType
    this.projectRoot = projectRoot
    this.options = options
  }

  /**
   * "opens" a project. Basically everything needed to launch the runner.
   */
  async open () {
    if (this.server) {
      throw Error('Server should not exist until #open is called - this should not happen.')
    }

    const { port, warning } = await this.openServer()

    this._config!.port = port
    const urls = config.setUrls(this.config)

    // update ports
    this._config = {
      ...this.config, 
      ...urls,
      // proxyServer: urls.proxyUrl,
      port
    }

    this._automation = new Automation(
      this.config.namespace, 
      this.config.socketIoCookie,
      this.config.screenshotsFolder, 
      (browserPreRequest) => {
        this.server!.addBrowserPreRequest(browserPreRequest)
      }
    )

    await this.startWebsockets()
  }

  get port () {
    if (!this._port) {
      throw Error('Open the server by calling #openServer before trying to access the port')
    }

    return this._port
  }

  get watchers () {
    return this._watchers
  }

  get reporter () {
    if (!this._reporter) {
      throw Error('Call initializeReporter first!')
    }
    return this._reporter
  }

  initializeReporter () {
    if (!this.config.report) {
      return
    }

    // if we've passed down reporter
    // then record these via mocha reporter
    try {
      Reporter.loadReporter(this.config.reporter, this.projectRoot)
    } catch (err) {
      const paths = Reporter.getSearchPathsForReporter(this.config.reporter, this.projectRoot)

      // only include the message if this is the standard MODULE_NOT_FOUND
      // else include the whole stack
      const errorMsg = err.code === 'MODULE_NOT_FOUND' ? err.message : err.stack

      errors.throw('INVALID_REPORTER_NAME', {
        paths,
        error: errorMsg,
        name: this.config.reporter,
      })
    }

    this._reporter = Reporter.create(
      this.config.reporter, this.config.reporterOptions, this.projectRoot)
  }

  async startWebsockets () {
    if (!this.server) {
      throw Error('You need a server before starting web sockets!')
    }

    this.server.startWebsockets(this.automation, this.config, {
      onConnect: (id: string) => {
        debug('socket:connected')
        this.emit('socket:connected', id)
      },

      onTestsReceivedAndMaybeRecord: async (runnables: RootRunnable, executeRunnable: () => any) => {
        debug('received runnables %o', runnables)
        this.initializeReporter()

        this.reporter.setRunnables(runnables)

        if (this._recordTests) {
          await this._recordTests(runnables, executeRunnable)

          this._recordTests = undefined

          return
        }

        executeRunnable()
      },

      onReloadBrowser: () => {
        throw Error('TODO onReloadBrowser')
        // options.onReloadBrowser,
      },

      onFocusTests: () => {
        throw Error('TODO onFocusTests')
        // options.onFocusTests,
      },

      onSpecChanged: () => {
        this.options.onSpecChanged?.()
      },

      onSavedStateChanged: () => {
        throw Error('TODO onSavedStateChanged')
      }, // options.onSavedStateChanged,

      onCaptureVideoFrames: (data) => {
        // TODO: move this to browser automation middleware
        this.emit('capture:video:frames', data)
      },

      onMocha: async (event: string, runnable: any) => {
        debug('onMocha', event)
        // bail if we dont have a
        // reporter instance
        if (!this.reporter) {
          return
        }

        this.reporter.emit(event, runnable)

        if (event === 'end') {
          const [stats, _] = await Promise.all([
            this.reporter.end(),
            this.server?.end()
          ])

          this.emit('end', stats || {})
        }
      },
    })
  }

  async initializeWatchers () {
    this._watchers = new Watchers()
  }

  async initializeSaveState ({ 
    isTextTerminal,
    projectRoot, 
  }: { 
    isTextTerminal: boolean,
    projectRoot: string
  }) {
    const state = await savedState.create(projectRoot, isTextTerminal)
    return await state.get()
  }

  async initializePlugins (testingType: TestingType) {
    const allowedCfg = config.allowed(this.config)

    const updatedConfig = await plugins.init(allowedCfg, {
      projectRoot: this.projectRoot,
      configFile: settings.pathToConfigFile(this.projectRoot, this.options),
      testingType: testingType,
      // Do we even need these?
      // onError: (err: Error) => {
      //   throw Error('TODO: Implement plugins error handling.')
      // },
      // onWarning: () => {
      //   throw Error('TODO: Implement plugins warning handling.')
      // }
    })

    return updatedConfig
  }

  // TODO
  shouldCorrelatePreRequests () {
    return true
  }

  async openServer () {
    const noop = (msg: any) => { console.log(`MSG IS:`, msg) }

    this._server = this.projectType === 'e2e'
      ? new ServerE2E()
      : new ServerCt()
    
    // await this.initializePlugins(this.options.testingType)
    
    debug('Creating server...')
    const [port, warning] = await this._server.open(this.config, {
      project: this,
      onError: this.options?.onError ?? noop,
      onWarning: this.options?.onWarning ?? noop,
      shouldCorrelatePreRequests: this.shouldCorrelatePreRequests,
      projectType: this.projectType,
      SocketCtor: this.projectType === 'e2e' ? SocketE2E : SocketCt,
      createRoutes: this.projectType === 'e2e' ? createE2ERoutes : createCTRoutes,
      specsStore: {} as any,
    })

    debug(`Created server on ${port}.`)
    
    return {
      port,
      warning
    }
  }

  get config () {
    if (!this._config) {
      throw Error('Call initializeConfig first!')
    }

    return this._config
  }

  get automation () {
    if (!this._automation) {
      throw Error ('Must initialize _automation before calling ProjectBase#open')
    }

    return this._automation
  }

  get server () {
    return this._server
  }

  getConfig () {
    return this.config
  }

  /**
   * Set config by reading user settings, merging with defaults and configuring urls.
   */
  async initializeConfig () {
    const defaultConfig = await config.get(this.projectRoot, this.options)
    const state = await this.initializeSaveState({ 
      projectRoot: this.projectRoot, 
      isTextTerminal: defaultConfig.isTextTerminal
    })

    this._config = {
      ...defaultConfig,
      state,
    }
  }

  // Does not need to be a method on ProjectBase
  static async getProjectStatus (clientProject) {
    console.warn('TODO#getProjectStatus')
  }

  // Does not need to be a method on ProjectBase
  static async getProjectStatuses (clientProject) {
    console.warn('TODO#getProjectStatuses')
  }

  /**
   * Reset spec and browser. Useful when changing specs via the desktop GUI.
   */
  reset () {
    this.spec = undefined
    this.browser = undefined

    this.automation?.reset()
    this.server?.reset()
  }

  /**
   * Set spec and browser.
   * This is useful for launching a runner, where you want to set both,
   * or closing a runner, where you want to reset both to be undefined.
   */
  setCurrentSpecAndBrowser ({
    spec,
    browser
  }: { 
    spec: Cypress.Cypress['spec'] | undefined, 
    browser: Cypress.Browser | undefined
  }) {
    this.spec = spec
    this.browser = browser
  }

  getCurrentSpecAndBrowser () {
    return {
      spec: this.spec,
      browser: this.browser,
    }
  }

  setOnTestsReceived (fn: RecordTests) {
    this._recordTests = fn
  }


  getSpecUrl (absoluteSpecPath: string, specType: 'integration' | 'component') {
    // if we don't have a absoluteSpecPath or its __all
    if (!absoluteSpecPath || (absoluteSpecPath === '__all')) {
      return normalizeSpecUrl(this.config.browserUrl, '/__all')
    }

    // TODO:
    // to handle both unit + integration tests we need
    // to figure out (based on the config) where this absoluteSpecPath
    // lives. does it live in the integrationFolder or
    // the unit folder?
    // once we determine that we can then prefix it correctly
    // with either integration or unit
    const prefixedPath = getPrefixedPathToSpec({
      integrationFolder: this.config.integrationFolder, 
      componentFolder: this.config.componentFolder, 
      projectRoot: this.projectRoot,
      type: specType,
      pathToSpec: absoluteSpecPath
    })

    return normalizeSpecUrl(this.config.browserUrl, prefixedPath)
  }

  /**
   * Cleans up everything. This is called when we kill the browser,
   * for example when you choose a new spec from the desktop GUI,
   * or you are done with using Cypress for the day.
   * 
   * Many of these things may not *need* to be called,
   * but we call them just in case anyway.
   * TODO: figure out what actually needs to happen, and what can
   * be done in a more sensible location.
   */
  async close () {
    debug('closing everything')

    this.setCurrentSpecAndBrowser({ spec: undefined, browser: undefined })

    const closePreprocessor = (this.projectType === 'e2e' && preprocessor.close) ?? (() => true)

    await Promise.all([
      this.closeServer(),
      this.watchers?.close(),
      closePreprocessor()
    ])

    process.chdir(localCwd)

    if (this.config.isTextTerminal || !this.config.experimentalInteractiveRunEvents) {
      return
    }

    return runEvents.execute('after:run', this.config)
  }

  async closeServer () {
    debug('closing server')

    if (!this.server) {
      return
    }

    await this.server.close()
    this._server = undefined
  }

  /**
   * Watches the plugins file for changes.
   * If it errors out, we catch the error and bubble it back
   * up to the UI via the onError callback.
   * 
   * If there is no error, currently we do not update the UI - the user
   * must click "try again". 
   * TODO: It'd be nice to automatically update the UI
   * so they don't need to click "try again".
   */
  async watchPluginsFile ({
    pluginsFile,
    isTextTerminal,
    onError
  }: {
    pluginsFile: string,
    isTextTerminal: boolean,
    onError: (err: Error) => void
  }): Promise<void> {
    debug(`attempt watch plugins file: ${pluginsFile}`)

    if (!pluginsFile || isTextTerminal) {
      return Promise.resolve()
    }

    const found = await fs.pathExists(pluginsFile)
    debug(`plugins file found? ${found}`)

    if (!found) {
      return
    }

    if (!this.watchers) {
      throw Error('Must call initializeWatchers before watching something!')
    }

    debug('watch plugins file')

    this.watchers.watchTree(pluginsFile, {
      onChange: async () => {
        // TODO: completely re-open project instead?
        debug('plugins file changed')

        try {
        // re-init plugins after a change
          const updatedConfig = await this.initializePlugins(
            this.projectType === 'ct' ? 'component' : 'e2e' as TestingType)

        } catch (err) {
          debug('error when executing plugins file', err)
          return onError(err)
        }
      }
    })
  }
}
