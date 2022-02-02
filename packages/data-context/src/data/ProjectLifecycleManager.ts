/**
 * The "Project Lifecycle" is the centralized manager for the project,
 * config, browser, and the number of possible states that can occur based
 * on inputs that change these behaviors.
 *
 * See `guides/app-lifecycle.md` for documentation on the project & possible
 * states that exist, and how they are managed.
 */
import { ChildProcess, ForkOptions, fork } from 'child_process'
import chokidar, { FSWatcher } from 'chokidar'
import path from 'path'
import inspector from 'inspector'
import _ from 'lodash'
import resolve from 'resolve'
import debugLib from 'debug'
import pDefer from 'p-defer'
import fs from 'fs'

import type { DataContext } from '..'
import { LoadConfigReply, SetupNodeEventsReply, ProjectConfigIpc, IpcHandler } from './ProjectConfigIpc'
import assert from 'assert'
import type { AllModeOptions, FoundBrowser, FullConfig, TestingType } from '@packages/types'
import type { BaseErrorDataShape, WarningError } from '.'
import { autoBindDebug } from '../util/autoBindDebug'

const debug = debugLib(`cypress:lifecycle:ProjectLifecycleManager`)

const CHILD_PROCESS_FILE_PATH = require.resolve('@packages/server/lib/plugins/child/require_async_child')

const UNDEFINED_SERIALIZED = '__cypress_undefined__'

export interface SetupFullConfigOptions {
  projectName: string
  projectRoot: string
  cliConfig: Partial<Cypress.ConfigOptions>
  config: Partial<Cypress.ConfigOptions>
  envFile: Partial<Cypress.ConfigOptions>
  options: Partial<AllModeOptions>
}

/**
 * All of the APIs injected from @packages/server & @packages/config
 * since these are not strictly typed
 */
export interface InjectedConfigApi {
  cypressVersion: string
  getServerPluginHandlers: () => IpcHandler[]
  validateConfig<T extends Cypress.ConfigOptions>(config: Partial<T>, onErr: (errMsg: string) => never): T
  allowedConfig(config: Cypress.ConfigOptions): Cypress.ConfigOptions
  updateWithPluginValues(config: FullConfig, modifiedConfig: Partial<Cypress.ConfigOptions>): FullConfig
  setupFullConfigWithDefaults(config: SetupFullConfigOptions): Promise<FullConfig>
  validateRootConfigBreakingChanges<T extends Cypress.ConfigOptions>(config: Partial<T>, onWarning: (warningMsg: string) => void, onErr: (errMsg: string) => never): T
}

type State<S, V = undefined> = V extends undefined ? {state: S, value?: V } : {state: S, value: V}

type LoadingStateFor<V> = State<'pending'> | State<'loading', Promise<V>> | State<'loaded', V> | State<'errored', Error>

type ConfigResultState = LoadingStateFor<LoadConfigReply>

type EnvFileResultState = LoadingStateFor<Cypress.ConfigOptions>

type SetupNodeEventsResultState = LoadingStateFor<SetupNodeEventsReply>

interface RequireWatchers {
  config: Record<string, chokidar.FSWatcher>
  setupNodeEvents: Record<string, chokidar.FSWatcher>
}

export interface ProjectMetaState {
  hasFrontendFramework: 'nuxt' | 'react' | 'react-scripts' | 'vue' | 'next' | false
  hasTypescript: boolean
  hasLegacyCypressJson: boolean
  hasCypressEnvFile: boolean
  hasValidConfigFile: boolean
  hasSpecifiedConfigViaCLI: false | string
  hasMultipleConfigPaths: boolean
  needsCypressJsonMigration: boolean
}

const PROJECT_META_STATE: ProjectMetaState = {
  hasFrontendFramework: false,
  hasTypescript: false,
  hasLegacyCypressJson: false,
  hasMultipleConfigPaths: false,
  hasCypressEnvFile: false,
  hasSpecifiedConfigViaCLI: false,
  hasValidConfigFile: false,
  needsCypressJsonMigration: false,
}

export class ProjectLifecycleManager {
  // Registered handlers from Cypress's server, used to wrap the IPC
  private _handlers: IpcHandler[] = []

  // Config, from the cypress.config.{js|ts}
  private _envFileResult: EnvFileResultState = { state: 'pending' }
  private _configResult: ConfigResultState = { state: 'pending' }
  private childProcesses = new Set<ChildProcess>()
  private watchers = new Set<chokidar.FSWatcher>()

  private _eventsIpc?: ProjectConfigIpc
  private _eventsIpcResult: SetupNodeEventsResultState = { state: 'pending' }
  private _registeredEvents: Record<string, Function> = {}
  private _registeredEventsTarget: TestingType | undefined
  private _eventProcess: ChildProcess | undefined
  private _currentTestingType: TestingType | null = null
  private _runModeExitEarly: ((error: Error) => void) | undefined

  private _initializedProject: unknown | undefined // open_project object
  private _projectRoot: string | undefined
  private _configFilePath: string | undefined
  private _configWatcher: FSWatcher | null = null

  private _cachedFullConfig: FullConfig | undefined

  private _projectMetaState: ProjectMetaState = { ...PROJECT_META_STATE }

  constructor (private ctx: DataContext) {
    this._handlers = this.ctx._apis.configApi.getServerPluginHandlers()
    this.watchers = new Set()

    if (ctx.coreData.currentProject) {
      this.setCurrentProject(ctx.coreData.currentProject)
    } else if (ctx.coreData.currentTestingType && this._projectRoot) {
      this.setCurrentTestingType(ctx.coreData.currentTestingType)
    }

    // see timers/parent.js line #93 for why this is necessary
    process.on('exit', this.onProcessExit)

    return autoBindDebug(this)
  }

  private onProcessExit = () => {
    this.resetInternalState()
  }

  async getProjectId (): Promise<string | null> {
    try {
      const contents = await this.getConfigFileContents()

      return contents.projectId ?? null
    } catch {
      return null
    }
  }

  get eventsIpcResult () {
    return Object.freeze(this._eventsIpcResult)
  }

  get metaState () {
    return Object.freeze(this._projectMetaState)
  }

  get legacyJsonPath () {
    return path.join(this.configFilePath, 'cypress.json')
  }

  get configFile () {
    return this.ctx.modeOptions.configFile ?? 'cypress.config.js'
  }

  get configFilePath () {
    assert(this._configFilePath, 'Expected configFilePath to be found')

    return this._configFilePath
  }

  get envFilePath () {
    return path.join(this.projectRoot, 'cypress.env.json')
  }

  get browsers () {
    if (this._cachedFullConfig) {
      return this._cachedFullConfig.browsers as FoundBrowser[]
    }

    return null
  }

  get errorLoadingConfigFile (): BaseErrorDataShape | null {
    if (this._configResult.state === 'errored') {
      return {
        title: 'Error Loading Config',
        message: this._configResult.value?.message || '',
        stack: this._configResult.value?.stack,
      }
    }

    return null
  }

  get errorLoadingNodeEvents (): BaseErrorDataShape | null {
    if (this._eventsIpcResult.state === 'errored') {
      return {
        title: 'Error Loading Config',
        message: this._eventsIpcResult.value?.message || '',
        stack: this._eventsIpcResult.value?.stack,
      }
    }

    return null
  }

  get isLoadingConfigFile () {
    return this._configResult.state === 'loading'
  }

  get isLoadingNodeEvents () {
    return this._eventsIpcResult.state === 'loading'
  }

  get loadedConfigFile (): Partial<Cypress.ConfigOptions> | null {
    return this._configResult.state === 'loaded' ? this._configResult.value.initialConfig : null
  }

  get loadedFullConfig (): FullConfig | null {
    return this._cachedFullConfig ?? null
  }

  get projectRoot () {
    assert(this._projectRoot, 'Expected projectRoot to be set in ProjectLifecycleManager')

    return this._projectRoot
  }

  get projectTitle () {
    return path.basename(this.projectRoot)
  }

  clearCurrentProject () {
    this.resetInternalState()
    this._initializedProject = undefined
    this._projectRoot = undefined
  }

  getPackageManagerUsed (projectRoot: string) {
    if (fs.existsSync(path.join(projectRoot, 'package-lock.json'))) {
      return 'npm'
    }

    if (fs.existsSync(path.join(projectRoot, 'yarn.lock'))) {
      return 'yarn'
    }

    if (fs.existsSync(path.join(projectRoot, 'pnpm-lock.yaml'))) {
      return 'pnpm'
    }

    return 'npm'
  }

  /**
   * When we set the current project, we need to cleanup the
   * previous project that might have existed. We use this as the
   * single location we should use to set the `projectRoot`, because
   * we can call it from legacy code and it'll be a no-op if the `projectRoot`
   * is already the same, otherwise it'll do the necessary cleanup
   */
  setCurrentProject (projectRoot: string) {
    if (this._projectRoot === projectRoot) {
      return
    }

    this._projectRoot = projectRoot
    this._initializedProject = undefined
    this.legacyPluginGuard()
    Promise.resolve(this.ctx.browser.machineBrowsers()).catch(this.onLoadError)
    this.verifyProjectRoot(projectRoot)
    const packageManagerUsed = this.getPackageManagerUsed(projectRoot)

    this.resetInternalState()
    this.ctx.update((s) => {
      s.currentProject = projectRoot
      s.packageManager = packageManagerUsed
    })

    const { needsCypressJsonMigration } = this.refreshMetaState()

    this.configFileWarningCheck()

    if (this.metaState.hasValidConfigFile) {
      // at this point, there is not a cypress configuration file to initialize
      // the project will be scaffolded and when the user selects the testing type
      // the would like to setup
      this.initializeConfig().catch(this.onLoadError)
    }

    this.loadCypressEnvFile().catch(this.onLoadError)

    if (this.ctx.coreData.currentTestingType) {
      this.setCurrentTestingType(this.ctx.coreData.currentTestingType)
    }

    // If migration is needed only initialize the watchers
    // when the migration is done.
    //
    // NOTE: If we watch the files while initializing,
    // the config will be loaded before the migration is complete.
    // The migration screen will disappear see `Main.vue` & `MigrationAction.ts`
    if (!needsCypressJsonMigration) {
      this.initializeConfigWatchers()
    }
  }

  setRunModeExitEarly (exitEarly: ((err: Error) => void) | undefined) {
    this._runModeExitEarly = exitEarly
  }

  get runModeExitEarly () {
    return this._runModeExitEarly
  }

  /**
   * Setting the testing type should automatically handle cleanup of existing
   * processes and load the config / initialize the plugin process associated
   * with the chosen testing type.
   */
  setCurrentTestingType (testingType: TestingType | null) {
    this.ctx.update((d) => {
      d.currentTestingType = testingType
    })

    if (this._currentTestingType === testingType) {
      return
    }

    this._initializedProject = undefined
    this._currentTestingType = testingType

    if (!testingType) {
      return
    }

    if (this.isTestingTypeConfigured(testingType)) {
      this.loadTestingType()
    }
  }

  /**
   * Called after we've set the testing type. If we've change from the current
   * IPC used to spawn the config, we need to get a fresh config IPC & re-execute.
   */
  private loadTestingType () {
    const testingType = this._currentTestingType

    assert(testingType, 'loadTestingType requires a testingType')

    // If we have set a testingType, and it's not the "target" of the
    // registeredEvents (switching testing mode), we need to get a fresh
    // config IPC & re-execute the setupTestingType
    if (this._registeredEventsTarget && testingType !== this._registeredEventsTarget) {
      this.reloadConfig().catch(this.onLoadError)
    } else if (this._eventsIpc && !this._registeredEventsTarget && this._configResult.state === 'loaded') {
      this.setupNodeEvents().catch(this.onLoadError)
    }
  }

  private killChildProcesses () {
    for (const proc of this.childProcesses) {
      this._cleanupProcess(proc)
    }
    this.childProcesses = new Set()
  }

  private _cleanupIpc (ipc: ProjectConfigIpc) {
    this._cleanupProcess(ipc.childProcess)
    ipc.removeAllListeners()
    if (this._eventsIpc === ipc) {
      this._eventsIpc = undefined
    }

    if (this._eventProcess === ipc.childProcess) {
      this._eventProcess = undefined
    }
  }

  private _cleanupProcess (proc: ChildProcess) {
    proc.kill()
    this.childProcesses.delete(proc)
  }

  private closeWatchers () {
    for (const watcher of this.watchers.values()) {
      // We don't care if there's an error while closing the watcher,
      // the watch listener on our end is already removed synchronously by chokidar
      watcher.close().catch((e) => {})
    }
    this.watchers = new Set()
  }

  private resetInternalState () {
    if (this._eventsIpc) {
      this._cleanupIpc(this._eventsIpc)
    }

    this.killChildProcesses()
    this.closeWatchers()
    this._configResult = { state: 'pending' }
    this._eventsIpcResult = { state: 'pending' }
    this._envFileResult = { state: 'pending' }
    this._requireWatchers = { config: {}, setupNodeEvents: {} }
    this._eventProcess = undefined
    this._registeredEventsTarget = undefined
    this._currentTestingType = null
    this._configFilePath = undefined
    this._cachedFullConfig = undefined
  }

  get eventProcessPid () {
    return this._eventProcess?.pid
  }

  /**
   * Equivalent to the legacy "config.get()",
   * this sources the config from the various config sources
   */
  async getFullInitialConfig (options: Partial<AllModeOptions> = this.ctx.modeOptions, withBrowsers = true): Promise<FullConfig> {
    if (this._cachedFullConfig) {
      return this._cachedFullConfig
    }

    const [configFileContents, envFile] = await Promise.all([
      this.getConfigFileContents(),
      this.loadCypressEnvFile(),
    ])

    const fullConfig = await this.buildBaseFullConfig(configFileContents, envFile, options, withBrowsers)

    if (this._currentTestingType) {
      this._cachedFullConfig = fullConfig
    }

    return fullConfig
  }

  private async buildBaseFullConfig (configFileContents: Cypress.ConfigOptions, envFile: Cypress.ConfigOptions, options: Partial<AllModeOptions>, withBrowsers = true) {
    this.validateConfigRoot(configFileContents)

    if (this._currentTestingType) {
      const testingTypeOverrides = configFileContents[this._currentTestingType] ?? {}

      // TODO: pass in options.config overrides separately, so they are reflected in the UI
      configFileContents = { ...configFileContents, ...testingTypeOverrides }
    }

    // TODO: Convert this to be synchronous, it's just FS checks
    let fullConfig = await this.ctx._apis.configApi.setupFullConfigWithDefaults({
      cliConfig: options.config ?? {},
      projectName: path.basename(this.projectRoot),
      projectRoot: this.projectRoot,
      config: _.cloneDeep(configFileContents),
      envFile: _.cloneDeep(envFile),
      options: {
        ...options,
        testingType: this._currentTestingType ?? 'e2e',
      },
    })

    if (withBrowsers) {
      const browsers = await this.ctx.browser.machineBrowsers()

      if (!fullConfig.browsers || fullConfig.browsers.length === 0) {
        // @ts-ignore - we don't know if the browser is headed or headless at this point.
        // this is handled in open_project#launch.
        fullConfig.browsers = browsers
        fullConfig.resolved.browsers = { 'value': fullConfig.browsers, 'from': 'runtime' }
      }

      fullConfig.browsers = fullConfig.browsers?.map((browser) => {
        if (browser.family === 'chromium' || fullConfig.chromeWebSecurity) {
          return browser
        }

        return {
          ...browser,
          warning: browser.warning || this.ctx._apis.errorApi.message('CHROME_WEB_SECURITY_NOT_SUPPORTED', browser.name),
        }
      })

      // If we have withBrowsers set to false, it means we're coming from the legacy config.get API
      // in tests, which shouldn't be validating the config
      this.validateConfigFile(this.configFile, fullConfig)
    }

    return _.cloneDeep(fullConfig)
  }

  // private injectCtSpecificConfig (cfg: FullConfig) {
  //   cfg.resolved.testingType = { value: 'component' }
  //   // This value is normally set up in the `packages/server/lib/plugins/index.js#110`
  //   // But if we don't return it in the plugins function, it never gets set
  //   // Since there is no chance that it will have any other value here, we set it to "component"
  //   // This allows users to not return config in the `cypress/plugins/index.js` file
  //   // https://github.com/cypress-io/cypress/issues/16860
  //   const rawJson = cfg.rawJson as Cfg
  //   return {
  //     ...cfg,
  //     componentTesting: true,
  //     viewportHeight: rawJson.viewportHeight ?? 500,
  //     viewportWidth: rawJson.viewportWidth ?? 500,
  //   }
  // }

  async getConfigFileContents () {
    if (this.ctx.modeOptions.configFile === false) {
      return {}
    }

    if (this._configResult.state === 'loaded') {
      return this._configResult.value.initialConfig
    }

    return this.initializeConfig()
  }

  /**
   * Initializes the config by executing the config file.
   * Returns the loaded config if we have already loaded the file
   */
  initializeConfig (): Promise<LoadConfigReply['initialConfig']> {
    if (this._configResult.state === 'loaded') {
      return Promise.resolve(this._configResult.value.initialConfig)
    }

    if (this._configResult.state === 'loading') {
      return this._configResult.value.then((v) => v.initialConfig)
    }

    if (this._configResult.state === 'errored') {
      return Promise.reject(this._configResult.value)
    }

    assert.strictEqual(this._configResult.state, 'pending')

    const { promise, child, ipc } = this._loadConfig()

    this._cachedFullConfig = undefined
    this._configResult = { state: 'loading', value: promise }

    promise.then((result) => {
      if (this._configResult.value === promise) {
        this._configResult = { state: 'loaded', value: result }
        this.validateConfigFile(this.configFilePath, result.initialConfig)
        this.onConfigLoaded(child, ipc, result)
      }

      this.ctx.emitter.toLaunchpad()
    })
    .catch((err) => {
      debug(`catch %o`, err)
      // this._cleanupIpc(ipc)
      if (this._configResult.value === promise) {
        this._configResult = { state: 'errored', value: err }
      }

      this.onLoadError(err)
      this.ctx.emitter.toLaunchpad()
    })

    return promise.then((v) => v.initialConfig)
  }

  private validateConfigRoot (config: Cypress.ConfigOptions) {
    return this.ctx._apis.configApi.validateRootConfigBreakingChanges(
      config,
      (warning, ...args) => {
        return this.ctx.warning(warning, ...args)
      },
      (err, ...args) => {
        throw this.ctx.error(err, ...args)
      },
    )
  }

  private validateConfigFile (file: string | false, config: Cypress.ConfigOptions) {
    this.ctx._apis.configApi.validateConfig(config, (errMsg) => {
      if (!file) {
        // This should never happen, b/c if the config file is false, the config
        // should be the default one
        throw this.ctx.error('CONFIG_VALIDATION_ERROR', errMsg)
      }

      const base = path.basename(file)

      throw this.ctx.error('SETTINGS_VALIDATION_ERROR', base, errMsg)
    })
  }

  /**
   * Initializes the "watchers" for the current
   * config for "open" mode.
   */
  initializeConfigWatchers () {
    if (this.ctx.isRunMode) {
      return
    }

    const legacyFileWatcher = this.addWatcher(_.without([
      this._pathToFile('cypress.json'),
      this._pathToFile('cypress.config.js'),
      this._pathToFile('cypress.config.ts'),
    ], this.configFilePath))

    legacyFileWatcher.on('all', (change) => {
      const metaState = this._projectMetaState
      const nextMetaState = this.refreshMetaState()

      if (!_.isEqual(metaState, nextMetaState)) {
        this.ctx.coreData.baseError = null
        this.reloadConfig().catch(this.onLoadError)
      }
    })

    this.initializeConfigFileWatcher()

    const cypressEnvFileWatcher = this.addWatcher(this.envFilePath)

    cypressEnvFileWatcher.on('all', () => {
      this.ctx.coreData.baseError = null
      this.reloadCypressEnvFile().catch(this.onLoadError)
    })
  }

  initializeConfigFileWatcher () {
    this._configWatcher = this.addWatcher(this.configFilePath)

    this._configWatcher.on('all', () => {
      this.ctx.coreData.baseError = null
      this.reloadConfig().catch(this.onLoadError)
    })
  }

  /**
   * When we detect a change to the config file path, we call "reloadConfig".
   * This sources a fresh IPC channel & reads the config. If we detect a change
   * to the config or the list of imported files, we will re-execute the setupNodeEvents
   */
  reloadConfig () {
    if (this._configResult.state === 'errored' || this._configResult.state === 'loaded') {
      this._configResult = { state: 'pending' }

      return this.initializeConfig()
    }

    if (this._configResult.state === 'loading' || this._configResult.state === 'pending') {
      return this.initializeConfig()
    }

    throw new Error(`Unreachable state`)
  }

  private _loadConfig () {
    const dfd = pDeferFulfilled<LoadConfigReply>()
    const child = this.forkConfigProcess()
    const ipc = this.wrapConfigProcess(child, dfd)

    return { promise: dfd.promise, child, ipc }
  }

  loadCypressEnvFile () {
    if (!this._projectMetaState.hasCypressEnvFile) {
      this._envFileResult = { state: 'loaded', value: {} }
    }

    if (this._envFileResult.state === 'loading') {
      return this._envFileResult.value
    }

    if (this._envFileResult.state === 'errored') {
      return Promise.reject(this._envFileResult.value)
    }

    if (this._envFileResult.state === 'loaded') {
      return Promise.resolve(this._envFileResult.value)
    }

    assert.strictEqual(this._envFileResult.state, 'pending')

    const promise = this.readCypressEnvFile().then((value) => {
      this.validateConfigFile(this.envFilePath, value)
      this._envFileResult = { state: 'loaded', value }

      return value
    })
    .catch((e) => {
      this._envFileResult = { state: 'errored', value: e }
      throw e
    })
    .finally(() => {
      this.ctx.emitter.toLaunchpad()
    })

    this._envFileResult = { state: 'loading', value: promise }

    return promise
  }

  private async reloadCypressEnvFile () {
    if (this._envFileResult.state === 'loading') {
      return this._envFileResult.value
    }

    this._envFileResult = { state: 'pending' }

    return this.loadCypressEnvFile()
  }

  /**
   * Initializes the config by reading the config file, if we
   * know we have one for the project
   */
  private async readCypressEnvFile (): Promise<Cypress.ConfigOptions> {
    try {
      return await this.ctx.fs.readJSON(this.envFilePath)
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return {}
      }

      if (err.isCypressErr) {
        throw err
      }

      throw this.ctx.error('ERROR_READING_FILE', this.envFilePath, err)
    }
  }

  private _requireWatchers: RequireWatchers = {
    config: {},
    setupNodeEvents: {},
  }

  private watchRequires (groupName: 'config' | 'setupNodeEvents', paths: string[]) {
    if (this.ctx.isRunMode) {
      return
    }

    const filtered = paths.filter((p) => !p.includes('/node_modules/'))
    const group = this._requireWatchers[groupName]
    const missing = _.xor(Object.keys(group), filtered)

    for (const path of missing) {
      if (!group[path]) {
        group[path] = this.addWatcherFor(groupName, path)
      } else {
        group[path]?.close()
        delete group[path]
      }
    }
  }

  /**
   * Called on the completion of the
   */
  private onConfigLoaded (child: ChildProcess, ipc: ProjectConfigIpc, result: LoadConfigReply) {
    this.watchRequires('config', result.requires)

    // If there's already a dangling IPC from the previous switch of testing type, we want to clean this up
    if (this._eventsIpc) {
      this._cleanupIpc(this._eventsIpc)
    }

    this._eventProcess = child
    this._eventsIpc = ipc

    if (!this._currentTestingType || this._eventsIpcResult.state === 'loading') {
      return
    }

    if (!this.isTestingTypeConfigured(this._currentTestingType) && !this.ctx.isRunMode) {
      this.ctx.actions.wizard.scaffoldTestingType().catch(this.onLoadError)

      return
    }

    if (this.ctx.coreData.scaffoldedFiles) {
      this.ctx.coreData.scaffoldedFiles.filter((f) => {
        if (f.file.absolute === this.configFilePath && f.status !== 'valid') {
          f.status = 'valid'
          this.ctx.emitter.toLaunchpad()
        }
      })
    }

    this.setupNodeEvents().catch(this.onLoadError)
  }

  private setupNodeEvents (): Promise<SetupNodeEventsReply> {
    assert(this._eventsIpc, 'Expected _eventsIpc to be defined at this point')
    const ipc = this._eventsIpc
    const promise = this.callSetupNodeEventsWithConfig(ipc)

    this._eventsIpcResult = { state: 'loading', value: promise }

    // This is a terrible hack until we land GraphQL subscriptions which will
    // allow for more granular concurrent notifications then our current
    // notify the frontend & refetch approach
    const toLaunchpad = this.ctx.emitter.toLaunchpad

    this.ctx.emitter.toLaunchpad = () => {}

    return promise.then(async (val) => {
      if (this._eventsIpcResult.value === promise) {
        // If we're handling the events, we don't want any notifications
        // to send to the client until the `.finally` of this block.
        // TODO: Remove when GraphQL Subscriptions lands
        await this.handleSetupTestingTypeReply(ipc, val)
        this._eventsIpcResult = { state: 'loaded', value: val }
      }

      return val
    })
    .catch((err) => {
      debug(`catch %o`, err)
      this._cleanupIpc(ipc)
      this._eventsIpcResult = { state: 'errored', value: err }
      throw err
    })
    .finally(() => {
      this.ctx.emitter.toLaunchpad = toLaunchpad
      this.ctx.emitter.toLaunchpad()
    })
  }

  private async callSetupNodeEventsWithConfig (ipc: ProjectConfigIpc): Promise<SetupNodeEventsReply> {
    const config = await this.getFullInitialConfig()

    assert(config)
    assert(this._currentTestingType)

    this._registeredEventsTarget = this._currentTestingType

    for (const handler of this._handlers) {
      handler(ipc)
    }

    const { promise } = this.registerSetupIpcHandlers(ipc)

    const overrides = config[this._currentTestingType] ?? {}
    const mergedConfig = { ...config, ...overrides }

    // alphabetize config by keys
    let orderedConfig = {} as Cypress.PluginConfigOptions

    Object.keys(mergedConfig).sort().forEach((key) => {
      const k = key as keyof typeof mergedConfig

      // @ts-ignore
      orderedConfig[k] = mergedConfig[k]
    })

    ipc.send('setupTestingType', this._currentTestingType, {
      ...orderedConfig,
      projectRoot: this.projectRoot,
      configFile: this.configFilePath,
      version: this.ctx._apis.configApi.cypressVersion,
      testingType: this._currentTestingType,
    })

    return promise
  }

  addWatcherFor (groupName: 'config' | 'setupNodeEvents', file: string) {
    const w = this.addWatcher(file)

    w.on('all', (evt) => {
      debug(`changed ${file}: ${evt}`)
      // TODO: in the future, we will make this more specific to the individual process we need to load
      if (groupName === 'config') {
        this.reloadConfig().catch(this.onLoadError)
      } else {
        // If we've edited the setupNodeEvents file, we need to re-execute
        // the config file to get a fresh ipc process to swap with
        this.reloadConfig().catch(this.onLoadError)
      }
    })

    return w
  }

  addWatcher (file: string | string[]) {
    const w = chokidar.watch(file, {
      ignoreInitial: true,
      cwd: this.projectRoot,
    })

    this.watchers.add(w)

    return w
  }

  closeWatcher (watcherToClose: FSWatcher) {
    for (const watcher of this.watchers.values()) {
      if (watcher === watcherToClose) {
        watcher.close().catch(() => {})
        this.watchers.delete(watcher)

        return
      }
    }
  }

  registerEvent (event: string, callback: Function) {
    debug(`register event '${event}'`)

    if (!_.isString(event)) {
      throw new Error(`The plugin register function must be called with an event as its 1st argument. You passed '${event}'.`)
    }

    if (!_.isFunction(callback)) {
      throw new Error(`The plugin register function must be called with a callback function as its 2nd argument. You passed '${callback}'.`)
    }

    this._registeredEvents[event] = callback
  }

  resetForTest () {
    this.resetInternalState()
    this._registeredEvents = {}
    this._handlers = []
  }

  hasNodeEvent (eventName: string) {
    const isRegistered = typeof this._registeredEvents[eventName] === 'function'

    debug('plugin event registered? %o', { eventName, isRegistered })

    return isRegistered
  }

  executeNodeEvent (event: string, args: any[]) {
    debug(`execute plugin event '${event}' Node '${process.version}' with args: %o %o %o`, ...args)

    const evtFn = this._registeredEvents[event]

    if (typeof evtFn !== 'function') {
      throw new Error(`Missing event for ${event}`)
    }

    return evtFn(...args)
  }

  private forkConfigProcess () {
    const configProcessArgs = ['--projectRoot', this.projectRoot, '--file', this.configFilePath]

    const childOptions: ForkOptions = {
      stdio: 'pipe',
      cwd: path.dirname(this.configFilePath),
      env: {
        ...process.env,
        NODE_OPTIONS: process.env.ORIGINAL_NODE_OPTIONS || '',
        // DEBUG: '*',
      },
      execPath: this.ctx.nodePath ?? undefined,
    }

    if (inspector.url()) {
      childOptions.execArgv = _.chain(process.execArgv.slice(0))
      .remove('--inspect-brk')
      .push(`--inspect=${process.debugPort + this.childProcesses.size + 1}`)
      .value()
    }

    debug('fork child process', CHILD_PROCESS_FILE_PATH, configProcessArgs, _.omit(childOptions, 'env'))

    const proc = fork(CHILD_PROCESS_FILE_PATH, configProcessArgs, childOptions)

    this.childProcesses.add(proc)

    return proc
  }

  private killChildProcess (child: ChildProcess) {
    child.kill()
    child.stdout?.removeAllListeners()
    child.stderr?.removeAllListeners()
    child.removeAllListeners()
  }

  private wrapConfigProcess (child: ChildProcess, dfd: pDefer.DeferredPromise<LoadConfigReply> & { settled: boolean }) {
    // The "IPC" is an EventEmitter wrapping the child process, adding a "send"
    // method, and re-emitting any "message" that comes through the channel through the EventEmitter
    const ipc = new ProjectConfigIpc(child)

    if (child.stdout && child.stderr) {
      // manually pipe plugin stdout and stderr for dashboard capture
      // @see https://github.com/cypress-io/cypress/issues/7434
      child.stdout.on('data', (data) => process.stdout.write(data))
      child.stderr.on('data', (data) => process.stderr.write(data))
    }

    child.on('error', (err) => {
      this.handleChildProcessError(err, ipc, dfd)
    })

    /**
     * This reject cannot be caught anywhere??
     *
     * It's supposed to be caught on lib/modes/run.js:1689,
     * but it's not.
     */
    ipc.on('childProcess:unhandledError', (err) => {
      return this.handleChildProcessError(err, ipc, dfd)
    })

    ipc.on('setupTestingType:uncaughtError', (err) => {
      return this.handleChildProcessError(err, ipc, dfd)
    })

    ipc.once('loadConfig:reply', (val) => {
      debug('loadConfig:reply')
      dfd.resolve({ ...val, initialConfig: JSON.parse(val.initialConfig) })
    })

    ipc.once('loadConfig:error', (type, ...args) => {
      debug('loadConfig:error %s, rejecting', type)
      this.killChildProcess(child)

      const err = this.ctx.error(type, ...args)

      // if it's a non-cypress error, restore the initial error
      if (!(err.message?.length)) {
        err.isCypressErr = false
        err.message = args[1]
        err.code = type
        err.name = type
      }

      dfd.reject(err)
    })

    debug('trigger the load of the file')
    ipc.send('loadConfig')

    return ipc
  }

  private handleChildProcessError (err: any, ipc: ProjectConfigIpc, dfd: pDefer.DeferredPromise<any> & {settled: boolean}) {
    debug('plugins process error:', err.stack)

    this._cleanupIpc(ipc)

    err = this.ctx._apis.errorApi.error('CHILD_PROCESS_UNEXPECTED_ERROR', this._currentTestingType, this.configFile, err.annotated || err.stack || err.message)
    err.title = 'Error running plugin'

    // this can sometimes trigger before the promise is fulfilled and
    // sometimes after, so we need to handle each case differently
    if (dfd.settled) {
      this.ctx.onError(err)
    } else {
      dfd.reject(err)
    }
  }

  private legacyPluginGuard () {
    // test and warn for incompatible plugin
    try {
      const retriesPluginPath = path.dirname(resolve.sync('cypress-plugin-retries/package.json', {
        basedir: this.projectRoot,
      }))

      this.ctx.onWarning(this.ctx.error('INCOMPATIBLE_PLUGIN_RETRIES', path.relative(this.projectRoot, retriesPluginPath)))
    } catch (e) {
      // noop, incompatible plugin not installed
    }
  }

  /**
   * Find all information about the project we need to know to prompt different
   * onboarding screens, suggestions in the onboarding wizard, etc.
   */
  refreshMetaState (): ProjectMetaState {
    const configFile = this.ctx.modeOptions.configFile
    const metaState: ProjectMetaState = {
      ...PROJECT_META_STATE,
      hasLegacyCypressJson: fs.existsSync(this._pathToFile('cypress.json')),
      hasCypressEnvFile: fs.existsSync(this._pathToFile('cypress.env.json')),
    }

    if (configFile === false) {
      return metaState
    }

    try {
      // Find the suggested framework, starting with meta-frameworks first
      const packageJson = this.ctx.fs.readJsonSync(this._pathToFile('package.json'))

      if (packageJson.dependencies?.typescript || packageJson.devDependencies?.typescript || fs.existsSync(this._pathToFile('tsconfig.json'))) {
        metaState.hasTypescript = true
      }

      for (const framework of ['next', 'nuxt', 'react-scripts', 'react', 'vue'] as const) {
        if (packageJson.dependencies?.[framework] || packageJson.devDependencies?.[framework]) {
          metaState.hasFrontendFramework = framework
          break
        }
      }
    } catch {
      // No need to handle
    }

    if (typeof configFile === 'string') {
      metaState.hasSpecifiedConfigViaCLI = this._pathToFile(configFile)
      if (configFile.endsWith('.json')) {
        metaState.needsCypressJsonMigration = true
      } else {
        this._configFilePath = this._pathToFile(configFile)
        if (fs.existsSync(this._configFilePath)) {
          metaState.hasValidConfigFile = true
        }
      }

      this._projectMetaState = metaState

      return metaState
    }

    const configFileTs = this._pathToFile('cypress.config.ts')
    const configFileJs = this._pathToFile('cypress.config.js')

    if (fs.existsSync(configFileTs)) {
      metaState.hasValidConfigFile = true
      this.setConfigFilePath('ts')
    }

    if (fs.existsSync(configFileJs)) {
      metaState.hasValidConfigFile = true
      if (this._configFilePath) {
        metaState.hasMultipleConfigPaths = true
      } else {
        this.setConfigFilePath('js')
      }
    }

    if (!this._configFilePath) {
      this.setConfigFilePath(metaState.hasTypescript ? 'ts' : 'js')
    }

    if (metaState.hasLegacyCypressJson && !metaState.hasValidConfigFile) {
      metaState.needsCypressJsonMigration = true
    }

    this._projectMetaState = metaState

    return metaState
  }

  setConfigFilePath (lang: 'ts' | 'js') {
    const configFilePath = this._configFilePath

    this._configFilePath = this._pathToFile(`cypress.config.${lang}`)

    if (configFilePath !== this._configFilePath && this._configWatcher) {
      this.closeWatcher(this._configWatcher)
      this.initializeConfigFileWatcher()
    }
  }

  private _pathToFile (file: string) {
    return path.isAbsolute(file) ? file : path.join(this.projectRoot, file)
  }

  private verifyProjectRoot (root: string) {
    try {
      if (!fs.statSync(root).isDirectory()) {
        throw new Error('NOT DIRECTORY')
      }
    } catch (err) {
      throw this.ctx.error('NO_PROJECT_FOUND_AT_PROJECT_ROOT', this.projectRoot)
    }
  }

  private async handleSetupTestingTypeReply (ipc: ProjectConfigIpc, result: SetupNodeEventsReply) {
    this._registeredEvents = {}
    this.watchRequires('setupNodeEvents', result.requires)

    for (const { event, eventId } of result.registrations) {
      debug('register plugins process event', event, 'with id', eventId)

      this.registerEvent(event, function (...args: any[]) {
        return new Promise((resolve, reject) => {
          const invocationId = _.uniqueId('inv')

          debug('call event', event, 'for invocation id', invocationId)

          ipc.once(`promise:fulfilled:${invocationId}`, (err: any, value: any) => {
            if (err) {
              debug('promise rejected for id %s %o', invocationId, ':', err.stack)
              reject(_.extend(new Error(err.message), err))

              return
            }

            if (value === UNDEFINED_SERIALIZED) {
              value = undefined
            }

            debug(`promise resolved for id '${invocationId}' with value`, value)

            return resolve(value)
          })

          const ids = { invocationId, eventId }

          // no argument is passed for cy.task()
          // This is necessary because undefined becomes null when it is sent through ipc.
          if (event === 'task' && args[1] === undefined) {
            args[1] = {
              __cypress_task_no_argument__: true,
            }
          }

          ipc.send('execute:plugins', event, ids, args)
        })
      })
    }

    assert(this._envFileResult.state === 'loaded')
    assert(this._configResult.state === 'loaded')

    const fullConfig = await this.buildBaseFullConfig(this._configResult.value.initialConfig, this._envFileResult.value, this.ctx.modeOptions)

    const finalConfig = this._cachedFullConfig = this.ctx._apis.configApi.updateWithPluginValues(fullConfig, result.setupConfig ?? {})

    // This happens automatically with openProjectCreate in run mode
    if (!this.ctx.isRunMode) {
      if (!this._initializedProject) {
        this._initializedProject = await this.ctx.actions.project.initializeActiveProject({})
      } else {
        // TODO: modify the _initializedProject
      }
    }

    if (this.ctx.coreData.cliBrowser) {
      await this.setActiveBrowser(this.ctx.coreData.cliBrowser)
    }

    this._pendingInitialize?.resolve(finalConfig)

    return result
  }

  private async setActiveBrowser (cliBrowser: string) {
    // When we're starting up, if we've chosen a browser to run with, check if it exists
    this.ctx.coreData.cliBrowser = null

    try {
      const browser = await this.ctx._apis.browserApi.ensureAndGetByNameOrPath(cliBrowser)

      this.ctx.coreData.chosenBrowser = browser ?? null
    } catch (e) {
      const error = e as Error

      this.ctx.onWarning(error)
    }
  }

  private registerSetupIpcHandlers (ipc: ProjectConfigIpc) {
    const dfd = pDefer<SetupNodeEventsReply>()

    ipc.childProcess.on('error', dfd.reject)

    // For every registration event, we want to turn into an RPC with the child process
    ipc.once('setupTestingType:reply', dfd.resolve)
    ipc.once('setupTestingType:error', (type, ...args) => {
      dfd.reject(this.ctx.error(type, ...args))
    })

    const handleWarning = (warningErr: WarningError) => {
      debug('plugins process warning:', warningErr.stack)

      return this.ctx.onWarning(warningErr)
    }

    ipc.on('warning', handleWarning)

    return dfd
  }

  destroy () {
    this.resetInternalState()
    // @ts-ignore
    process.removeListener('exit', this.onProcessExit)
  }

  isTestingTypeConfigured (testingType: TestingType): boolean {
    const config = this.loadedConfigFile

    if (!config) {
      return false
    }

    if (!_.has(config, testingType)) {
      return false
    }

    if (testingType === 'component') {
      return Boolean(config.component?.devServer)
    }

    return true
  }

  private _pendingInitialize?: pDefer.DeferredPromise<FullConfig>

  async initializeRunMode () {
    this._pendingInitialize = pDefer()

    if (!this._currentTestingType) {
      this.setCurrentTestingType('e2e')
      // TODO: Warn on this
      // this.ctx.onWarning(this.ctx.error('TESTING_TYPE_NEEDED_FOR_RUN'))
    }

    if (!this.metaState.hasValidConfigFile) {
      return this.ctx.onError(this.ctx.error('NO_DEFAULT_CONFIG_FILE_FOUND', this.projectRoot))
    }

    return this._pendingInitialize.promise.finally(() => {
      this._pendingInitialize = undefined
    })
  }

  private configFileWarningCheck () {
    // Only if they've explicitly specified a config file path do we error, otherwise they'll go through onboarding
    if (!this.metaState.hasValidConfigFile && this.metaState.hasSpecifiedConfigViaCLI !== false && this.ctx.isRunMode) {
      this.ctx.onError(this.ctx.error('CONFIG_FILE_NOT_FOUND', path.basename(this.metaState.hasSpecifiedConfigViaCLI), path.dirname(this.metaState.hasSpecifiedConfigViaCLI)))
    }

    if (this.metaState.hasLegacyCypressJson && !this.metaState.hasValidConfigFile && this.ctx.isRunMode) {
      this.ctx.onError(this.ctx.error('CONFIG_FILE_MIGRATION_NEEDED', this.projectRoot))
    }

    if (this.metaState.hasMultipleConfigPaths) {
      this.ctx.onError(this.ctx.error('CONFIG_FILES_LANGUAGE_CONFLICT', this.projectRoot))
    }

    if (this.metaState.hasValidConfigFile && this.metaState.hasLegacyCypressJson) {
      this.ctx.onError(this.ctx.error('LEGACY_CONFIG_FILE', this.projectRoot, path.basename(this.configFilePath)))
    }
  }

  /**
   * When there is an error during any part of the lifecycle
   * initiation, we pass it through here. This allows us to intercept
   * centrally in the e2e tests, as well as notify the "pending initialization"
   * for run mode
   */
  private onLoadError = (err: any) => {
    this._pendingInitialize?.reject(err)
  }
}

function pDeferFulfilled<T> (): pDefer.DeferredPromise<T> & {settled: boolean} {
  const dfd = pDefer<T>()
  let settled = false
  const { promise, resolve, reject } = dfd

  const resolveFn = function (val: T) {
    settled = true

    return resolve(val)
  }

  const rejectFn = function (val: any) {
    settled = true

    return reject(val)
  }

  return {
    promise,
    resolve: resolveFn,
    reject: rejectFn,
    get settled () {
      return settled
    },
  }
}
