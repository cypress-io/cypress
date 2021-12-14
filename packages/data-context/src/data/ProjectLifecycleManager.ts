/**
 * The "Project Lifecycle" is the centralized manager for the project,
 * config, browser, and the number of possible states that can occur based
 * on inputs that change these behaviors.
 *
 * See `guides/app-lifecycle.md` for documentation on the project & possible
 * states that exist, and how they are managed.
 */
import { ChildProcess, ForkOptions, fork } from 'child_process'
import chokidar from 'chokidar'
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
import type { BaseErrorDataShape } from '.'
import { autoBindDebug } from '../util/autoBindDebug'

const debug = debugLib(`cypress:lifecycle:ProjectLifecycleManager:${process.pid}`)

const CHILD_PROCESS_FILE_PATH = require.resolve('@packages/server/lib/plugins/child/require_async_child')

const UNDEFINED_SERIALIZED = '__cypress_undefined__'

// Explicitly picking off all the keys we need to use, so we can create stubs for a unit test
export type Ctx_ProjectLifecycleManager = Pick<DataContext,
  '_apis' | 'fs' | 'coreData' | 'modeOptions' | 'update' |
  'nodePath' | 'error' | 'onWarning' | 'onError' | 'isRunMode' | 'emitter'
>

export interface SetupFullConfigOptions {
  projectName: string
  projectRoot: string
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
}

type State<S, V = undefined> = V extends undefined ? {state: S, value?: V} : {state: S, value: V}

type LoadingStateFor<V> = State<'pending'> | State<'loading', Promise<V>> | State<'loaded', V> | State<'errored', unknown>

type BrowsersResultState = LoadingStateFor<FoundBrowser[]>

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
  hasMultipleConfigPaths: boolean
  needsCypressJsonMigration: boolean
}

const PROJECT_META_STATE: ProjectMetaState = {
  hasFrontendFramework: false,
  hasTypescript: false,
  hasLegacyCypressJson: false,
  hasMultipleConfigPaths: false,
  hasCypressEnvFile: false,
  hasValidConfigFile: false,
  needsCypressJsonMigration: false,
}

export class ProjectLifecycleManager {
  // Registered handlers from Cypress's server, used to wrap the IPC
  private _handlers: IpcHandler[] = []
  private _browserResult: BrowsersResultState = { state: 'pending' }

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

  private _projectRoot: string | undefined
  private _configFilePath: string | undefined

  private _cachedFullConfig: FullConfig | undefined

  private _projectMetaState: ProjectMetaState = { ...PROJECT_META_STATE }

  async getProjectId (): Promise<string | null> {
    try {
      const contents = await this.getConfigFileContents()

      return contents.projectId ?? null
    } catch {
      // throw errors.throw('NO_PROJECT_ID', settings.configFile(this.options), this.projectRoot)
      return null
    }
  }

  get metaState () {
    return Object.freeze(this._projectMetaState)
  }

  get legacyJsonPath () {
    return path.join(this.configFilePath, 'cypress.json')
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
        message: String(this._configResult.value), // TODO: fix
      }
    }

    return null
  }

  get errorLoadingNodeEvents (): BaseErrorDataShape | null {
    if (this._configResult.state === 'errored') {
      return {
        title: 'Error Loading Config',
        message: String(this._configResult.value), // TODO: fix
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

  constructor (private ctx: Ctx_ProjectLifecycleManager) {
    this._handlers = this.ctx._apis.configApi.getServerPluginHandlers()
    this.legacyPluginGuard()
    this.watchers = new Set()
    this.loadGlobalBrowsers().catch(expectedError)

    if (ctx.coreData.currentProject) {
      this.setCurrentProject(ctx.coreData.currentProject)
    }

    if (ctx.coreData.currentTestingType) {
      this.setCurrentTestingType(ctx.coreData.currentTestingType)
    }

    // see timers/parent.js line #93 for why this is necessary
    process.on('exit', () => {
      this.resetInternalState()
    })

    return autoBindDebug(this)
  }

  clearCurrentProject () {
    this.resetInternalState()
    this._projectRoot = undefined
    this._configFilePath = undefined
    this._cachedFullConfig = undefined
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

    this.verifyProjectRoot(projectRoot)
    this._projectRoot = projectRoot
    this.resetInternalState()
    this.ctx.update((s) => {
      s.currentProject = projectRoot
    })

    this._projectMetaState = this.determineProjectMetaState()
    this.configFileWarningCheck()

    if (this._projectMetaState.hasValidConfigFile) {
      this.initializeConfig().catch(expectedError)
    }

    this.loadCypressEnvFile().catch(expectedError)

    this.initializeConfigWatchers()
  }

  /**
   * When we set the "testingType", we
   */
  setCurrentTestingType (testingType: TestingType | null) {
    this.ctx.update((d) => {
      d.currentTestingType = testingType
    })

    if (this._currentTestingType === testingType) {
      return
    }

    this._currentTestingType = testingType

    if (!testingType) {
      return
    }

    // If we have set a testingType, and it's not the "target" of the
    // registeredEvents (switching testing mode), we need to get a fresh
    // config IPC & re-execute the setupTestingType
    if (this._registeredEventsTarget && testingType !== this._registeredEventsTarget) {
      this._configResult = { state: 'pending' }
      this.initializeConfig()
    } else if (this._eventsIpc && !this._registeredEventsTarget && this._configResult.state === 'loaded') {
      this.setupNodeEvents()
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
      watcher.close()
    }
    this.watchers = new Set()
  }

  private resetInternalState () {
    this.killChildProcesses()
    this.closeWatchers()
    this._configResult = { state: 'pending' }
    this._eventsIpcResult = { state: 'pending' }
    this._requireWatchers = { config: {}, setupNodeEvents: {} }
    this._eventProcess = undefined
    this._currentTestingType = null
    this._configFilePath = undefined
  }

  get eventProcessPid () {
    return this._eventProcess?.pid
  }

  /**
   * Equivalent to the legacy "config.get()",
   * this sources the config from all the
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
    if (this._currentTestingType) {
      const testingTypeOverrides = configFileContents[this._currentTestingType] ?? {}

      configFileContents = { ...configFileContents, ...testingTypeOverrides }
    }

    // TODO: Convert this to be synchronous,
    let fullConfig = await this.ctx._apis.configApi.setupFullConfigWithDefaults({
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
      const browsers = await this.loadGlobalBrowsers()

      if (!fullConfig.browsers || fullConfig.browsers.length === 0) {
        // @ts-ignore - we don't know if the browser is headed or headless at this point.
        // this is handled in open_project#launch.
        fullConfig.browsers = browsers
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
    })
    .catch((err) => {
      if (this._configResult.value === promise) {
        this._configResult = { state: 'errored', value: err }
      }
    })
    .finally(() => {
      this.ctx.emitter.toLaunchpad()
    })

    return promise.then((v) => v.initialConfig)
  }

  private validateConfigFile (file: string, config: Cypress.ConfigOptions) {
    this.ctx._apis.configApi.validateConfig(config, (errMsg) => {
      throw this.ctx.error('SETTINGS_VALIDATION_ERROR', file, errMsg)
    })
  }

  /**
   * Initializes the "watchers" for the current
   * config for "open" mode.
   */
  private initializeConfigWatchers () {
    if (this.ctx.isRunMode) {
      return
    }

    if (this._projectMetaState.hasLegacyCypressJson) {
      const legacyFileWatcher = this.addWatcher(this.legacyJsonPath)

      legacyFileWatcher.on('all', () => {
        this._projectMetaState = this.determineProjectMetaState()
      })
    }

    const configFileWatcher = this.addWatcher(this.configFilePath)

    configFileWatcher.on('all', () => {
      this.reloadConfig().catch(expectedError)
    })

    const cypressEnvFileWatcher = this.addWatcher(this.envFilePath)

    cypressEnvFileWatcher.on('all', () => {
      this.reloadCypressEnvFile()
    })
  }

  /**
   * When we detect a change to the config file path, we call "reloadConfig".
   * This sources a fresh IPC channel & reads the config. If we detect a change
   * to the config or the list of imported files, we will re-execute the setupNodeEvents
   */
  async reloadConfig (force = false) {
    if (this._configResult.state === 'errored') {
      this._configResult = { state: 'pending' }

      return this.initializeConfig()
    }

    if (this._configResult.state === 'loading' || this._configResult.state === 'pending') {
      return this.initializeConfig()
    }

    assert.strictEqual(this._configResult.state, 'loaded')

    const { ipc, child, promise } = this._loadConfig()

    const currentResult = this._configResult

    try {
      const result = await promise

      // If we've swapped out _configResult during the async/await, we don't want to mutate it
      if (currentResult !== this._configResult) {
        return {}
      }

      if (force || !_.isEqual(result, this._configResult.value)) {
        this.validateConfigFile(this.configFilePath, result.initialConfig)
        this._configResult.value = result
        this.onConfigLoaded(child, ipc, result)
      }

      return result.initialConfig
    } catch (e: any) {
      // If we have a known good state from eariler, then we
      // don't want this error to blow it away. Instead trigger
      // an error.
      this.ctx.onError(e, 'config')

      return {}
    }
  }

  private _loadConfig () {
    const dfd = pDefer<LoadConfigReply>()
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

    const promise = this.readCypressEnvFile()

    this._envFileResult = { state: 'loading', value: promise }

    promise.then((value) => {
      this._envFileResult = { state: 'loaded', value }
    })
    .catch((e) => {
      this._envFileResult = { state: 'errored', value: e }
    })
    .finally(() => {
      this.ctx.emitter.toLaunchpad()
    })

    return promise
  }

  private async reloadCypressEnvFile () {
    if (this._envFileResult.state === 'errored') {
      this._envFileResult = { state: 'pending' }

      return this.loadCypressEnvFile()
    }

    if (this._envFileResult.state === 'loading') {
      return this._envFileResult.value
    }

    if (this._envFileResult.state === 'loaded') {
      this.readCypressEnvFile()
    }
  }

  /**
   * Initializes the config by reading the config file, if we
   * know we have one for the project
   */
  private async readCypressEnvFile () {
    try {
      const data = await this.ctx.fs.readJSON(this.envFilePath)

      this.validateConfigFile(this.envFilePath, data)

      return data
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

  refreshCypressEnvFile () {
    //
  }

  /**
   * Called on the completion of the
   */
  private onConfigLoaded (child: ChildProcess, ipc: ProjectConfigIpc, result: LoadConfigReply) {
    this.watchRequires('config', result.requires)
    if (this._eventsIpc) {
      this._cleanupIpc(this._eventsIpc)
    }

    this._eventProcess = child
    this._eventsIpc = ipc

    if (!this._currentTestingType || this._eventsIpcResult.state === 'loading') {
      return
    }

    this.setupNodeEvents().catch(expectedError)
  }

  private async setupNodeEvents (): Promise<SetupNodeEventsReply> {
    const config = await this.initializeConfig()

    assert(this._eventsIpc)
    assert(this._currentTestingType)

    this._registeredEventsTarget = this._currentTestingType

    const ipc = this._eventsIpc

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

    this._eventsIpcResult = { state: 'loading', value: promise }

    promise.then(async (val) => {
      this._eventsIpcResult = { state: 'loaded', value: val }
      await this.handleSetupTestingTypeReply(ipc, val)
    })
    .catch((err) => {
      this._cleanupIpc(ipc)
      this._eventsIpcResult = { state: 'errored', value: err }
    })
    .finally(() => {
      this.ctx.emitter.toLaunchpad()
    })

    return promise
  }

  addWatcherFor (groupName: 'config' | 'setupNodeEvents', file: string) {
    const w = this.addWatcher(file)

    w.on('all', (evt) => {
      debug(`changed ${file}: ${evt}`)
      if (groupName === 'config') {
        this.reloadConfig()
      } else {
        // If we've edited the setupNodeEvents file, we need to re-execute
        // the config file to get a fresh ipc process to swap with
        this.reloadConfig(true)
      }
    })

    return w
  }

  addWatcher (file: string) {
    const w = chokidar.watch(file, {
      ignoreInitial: true,
    })

    this.watchers.add(w)

    return w
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

    if (this._registeredEvents[event]) {
      return this._registeredEvents[event]?.(...args)
    }

    // Warn &

    return false
  }

  loadGlobalBrowsers () {
    if (this._browserResult.state === 'loaded') {
      return Promise.resolve(this._browserResult.value)
    }

    if (this._browserResult.state === 'errored') {
      return Promise.reject(this._browserResult.value)
    }

    if (this._browserResult.state === 'loading') {
      return this._browserResult.value
    }

    const p = this.ctx._apis.appApi.getBrowsers()

    this._browserResult = { state: 'loading', value: p }
    p.then(
      (b) => {
        if (p === this._browserResult.value) {
          this._browserResult = { state: 'loaded', value: b }
        }
      },
      (e) => {
        if (p === this._browserResult.value) {
          this._browserResult = { state: 'errored', value: e }
          this.ctx.onError(e, 'global')
        }
      },
    )

    return p
  }

  reloadGlobalBrowsers () {
    this._browserResult = { state: 'pending' }

    return this.loadGlobalBrowsers()
  }

  private forkConfigProcess () {
    const configProcessArgs = ['--projectRoot', this.projectRoot, '--file', this.configFilePath]

    const childOptions: ForkOptions = {
      stdio: 'pipe',
      cwd: path.dirname(this.configFilePath),
      env: {
        ...process.env,
        NODE_OPTIONS: process.env.ORIGINAL_NODE_OPTIONS || '',
      },
      execPath: this.ctx.nodePath ?? undefined,
    }

    if (inspector.url()) {
      childOptions.execArgv = _.chain(process.execArgv.slice(0))
      .remove('--inspect-brk')
      .push(`--inspect=${process.debugPort + this.childProcesses.size + 1}`)
      .value()
    }

    debug('fork child process', CHILD_PROCESS_FILE_PATH, configProcessArgs, childOptions)

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

  private wrapConfigProcess (child: ChildProcess, dfd: pDefer.DeferredPromise<LoadConfigReply>) {
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
      dfd.reject(err)
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
  private determineProjectMetaState (): ProjectMetaState {
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
      metaState.hasValidConfigFile = true
      this._configFilePath = this._pathToFile(configFile)

      return metaState
    }

    const configFileTs = this._pathToFile('cypress.config.ts')
    const configFileJs = this._pathToFile('cypress.config.js')

    if (fs.existsSync(configFileTs)) {
      metaState.hasValidConfigFile = true
      this._configFilePath = configFileTs
    }

    if (fs.existsSync(configFileJs)) {
      metaState.hasValidConfigFile = true
      if (this._configFilePath) {
        metaState.hasMultipleConfigPaths = true
      } else {
        this._configFilePath = configFileJs
      }
    }

    if (metaState.hasLegacyCypressJson && !metaState.hasValidConfigFile) {
      metaState.needsCypressJsonMigration = true
    }

    return metaState
  }

  private _pathToFile (file: string) {
    return path.isAbsolute(file) ? file : path.join(this.projectRoot, file)
  }

  private verifyProjectRoot (root: string) {
    try {
      if (!fs.statSync(root).isDirectory()) {
        throw new Error()
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
        const evtDfd = pDefer()
        const invocationId = _.uniqueId('inv')

        debug('call event', event, 'for invocation id', invocationId)

        ipc.once(`promise:fulfilled:${invocationId}`, (err: any, value: any) => {
          if (err) {
            debug('promise rejected for id %s %o', invocationId, ':', err.stack)
            evtDfd.reject(_.extend(new Error(err.message), err))

            return
          }

          if (value === UNDEFINED_SERIALIZED) {
            value = undefined
          }

          debug(`promise resolved for id '${invocationId}' with value`, value)

          return evtDfd.resolve(value)
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

        return evtDfd.promise
      })
    }

    assert(this._envFileResult.state === 'loaded')
    assert(this._configResult.state === 'loaded')

    const fullConfig = await this.buildBaseFullConfig(this._configResult.value.initialConfig, this._envFileResult.value, this.ctx.modeOptions)

    this._cachedFullConfig = this.ctx._apis.configApi.updateWithPluginValues(fullConfig, result.setupConfig ?? {})
  }

  private registerSetupIpcHandlers (ipc: ProjectConfigIpc) {
    const dfd = pDefer<SetupNodeEventsReply>()

    // For every registration event, we want to turn into an RPC with the child process
    ipc.once('setupTestingType:reply', dfd.resolve)
    ipc.once('setupTestingType:error', (type, ...args) => {
      dfd.reject(this.ctx.error(type, ...args))
    })

    //     const handleError = (err) => {
    //       debug('plugins process error:', err.stack)

    //       if (!pluginsProcess) return // prevent repeating this in case of multiple errors

    //       killPluginsProcess()

    //       err = errors.get('SETUP_NODE_EVENTS_UNEXPECTED_ERROR', config.testingType, config.configFile, err.annotated || err.stack || err.message)
    //       err.title = 'Error running plugin'

    //       // this can sometimes trigger before the promise is fulfilled and
    //       // sometimes after, so we need to handle each case differently
    //       if (fulfilled) {
    //         options.onError(err)
    //       } else {
    //         reject(err)
    //       }
    //     }

    //     const handleWarning = (warningErr) => {
    //       debug('plugins process warning:', warningErr.stack)
    //       if (!pluginsProcess) return // prevent repeating this in case of multiple warnings

    //       return options.onWarning(warningErr)
    //     }

    //     pluginsProcess.on('error', handleError)
    //     ipc.on('error:plugins', handleError)
    //     ipc.on('warning', handleWarning)

    return dfd
  }

  isTestingTypeConfigured (testingType: TestingType) {
    const config = this.loadedFullConfig ?? this.loadedConfigFile

    if (!config) {
      return null
    }

    if (!_.has(config, testingType)) {
      return false
    }

    if (testingType === 'component') {
      // @ts-expect-error
      return Boolean(config.component?.devServer)
    }

    return true
  }

  async initializeRunMode () {
    if (!this._currentTestingType) {
      this.setCurrentTestingType('e2e')
      this.ctx.onWarning(this.ctx.error('TESTING_TYPE_NEEDED_FOR_RUN'))
    }

    if (!this.metaState.hasValidConfigFile) {
      return this.ctx.onError(this.ctx.error('NO_DEFAULT_CONFIG_FILE_FOUND', this.projectRoot), 'global')
    }

    await this.setupNodeEvents()
  }

  private configFileWarningCheck () {
    if (this.metaState.hasMultipleConfigPaths) {
      this.ctx.onWarning(this.ctx.error('CONFIG_FILES_LANGUAGE_CONFLICT', this.projectRoot))
    }

    if (this.metaState.hasValidConfigFile && this.metaState.hasLegacyCypressJson) {
      this.ctx.onWarning(this.ctx.error('LEGACY_CONFIG_FILE', this.projectRoot))
    }
  }
}

// When we expect an error, but we want to handle it so we don't have an unhandled promise,
// and we want to read the `stack` property of the error
function expectedError (err: any) {
  err?.stack
}
