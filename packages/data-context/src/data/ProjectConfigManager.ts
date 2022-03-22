import { CypressError, getError } from '@packages/errors'
import { IpcHandler, LoadConfigReply, ProjectConfigIpc, SetupNodeEventsReply } from './ProjectConfigIpc'
import assert from 'assert'
import pDefer from 'p-defer'
import type { AllModeOptions, FoundBrowser, FullConfig, OpenProjectLaunchOptions, TestingType } from '@packages/types'
import debugLib from 'debug'
import { ChildProcess, ForkOptions, fork } from 'child_process'
import path from 'path'
import _ from 'lodash'
import inspector from 'inspector'
import fs from 'fs-extra'
import chokidar from 'chokidar'
import { validate as validateConfig, validateNoBreakingConfigLaunchpad, validateNoBreakingConfigRoot, validateNoBreakingTestingTypeConfig } from '@packages/config'
import type { SetupFullConfigOptions } from './ProjectLifecycleManager'

const debug = debugLib(`cypress:lifecycle:ProjectConfigManager`)

const CHILD_PROCESS_FILE_PATH = require.resolve('@packages/server/lib/plugins/child/require_async_child')

const UNDEFINED_SERIALIZED = '__cypress_undefined__'

type State<S, V = undefined> = V extends undefined ? {state: S, value?: V } : {state: S, value: V}

type LoadingStateFor<V> = State<'pending'> | State<'loading', Promise<V>> | State<'loaded', V> | State<'errored', CypressError>

type ConfigResultState = LoadingStateFor<LoadConfigReply>

type EnvFileResultState = LoadingStateFor<Cypress.ConfigOptions>

type SetupNodeEventsResultState = LoadingStateFor<SetupNodeEventsReply>

interface RequireWatchers {
  config: Record<string, chokidar.FSWatcher>
  setupNodeEvents: Record<string, chokidar.FSWatcher>
}

type ProjectConfigManagerOptions = {
  configFilePath: string
  configFile: string | false
  projectRoot: string
  nodePath: string | null | undefined
  modeOptions: Partial<AllModeOptions>
  isRunMode: boolean
  handlers: IpcHandler[]
  hasCypressEnvFile: boolean
  cypressVersion: string
  onError: (cypressError: CypressError, title?: string | undefined) => void
  onWarning: (err: CypressError) => void
  toLaunchpad: (...args: any[]) => void
  onConfigLoaded: () => void
  setActiveBrowser: () => Promise<void>
  updateWithPluginValues: (config: FullConfig, modifiedConfig: Partial<Cypress.ConfigOptions>) => FullConfig
  initializeActiveProject: (options?: OpenProjectLaunchOptions) => Promise<unknown>
  setupFullConfigWithDefaults: (config: SetupFullConfigOptions) => Promise<FullConfig>
  machineBrowsers: () => FoundBrowser[] | Promise<FoundBrowser[]>
}

export class ProjectConfigManager {
  private _envFileResult: EnvFileResultState = { state: 'pending' }
  private _configResult: ConfigResultState = { state: 'pending' }
  private _cachedFullConfig: FullConfig | undefined
  private _childProcesses = new Set<ChildProcess>()
  private _eventsIpc?: ProjectConfigIpc
  private _eventProcess: ChildProcess | undefined
  private _eventsIpcResult: SetupNodeEventsResultState = { state: 'pending' }
  private _requireWatchers: RequireWatchers = {
    config: {},
    setupNodeEvents: {},
  }
  private _pendingInitialize?: pDefer.DeferredPromise<FullConfig>
  private _watchers = new Set<chokidar.FSWatcher>()
  private _registeredEvents: Record<string, Function> = {}
  private _registeredEventsTarget: TestingType | undefined
  private _initializedProject: unknown | undefined
  private _testingType: TestingType | undefined

  constructor (private options: ProjectConfigManagerOptions) {}

  get loadedConfigFile (): Partial<Cypress.ConfigOptions> | null {
    return this._configResult.state === 'loaded' ? this._configResult.value.initialConfig : null
  }

  get envFilePath () {
    return path.join(this.options.projectRoot, 'cypress.env.json')
  }

  get loadedFullConfig (): FullConfig | null {
    return this._cachedFullConfig ?? null
  }

  get isLoadingNodeEvents () {
    return this._eventsIpcResult.state === 'loading'
  }

  get isLoadedNodeEvents () {
    return this._eventsIpcResult.state === 'loaded'
  }

  get isLoadingConfigFile () {
    return this._configResult.state === 'loading'
  }

  get isLoadedConfigFile () {
    return this._configResult.state === 'loaded'
  }

  setTestingType (testingType: TestingType) {
    this._testingType = testingType
  }

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
        debug(`config is loaded for file`, this.options.configFilePath, this._testingType)
        this._configResult = { state: 'loaded', value: result }
        this.validateConfigFile(this.options.configFilePath, result.initialConfig)

        this.watchRequires('config', result.requires)

        // If there's already a dangling IPC from the previous switch of testing type, we want to clean this up
        if (this._eventsIpc) {
          this._cleanupIpc(this._eventsIpc)
        }

        this._eventProcess = child
        this._eventsIpc = ipc

        if (!this._testingType || this._eventsIpcResult.state === 'loading') {
          return
        }

        this.options.onConfigLoaded()

        if (this.isTestingTypeConfigured(this._testingType) || this.options.isRunMode) {
          this.setupNodeEvents().catch(this.onLoadError)
        }
      }

      this.options.toLaunchpad()
    })
    .catch((err) => {
      debug(`catch %o`, err)
      this._cleanupIpc(ipc)
      this._configResult = { state: 'errored', value: err }

      this.onLoadError(err)

      this.options.toLaunchpad()
    })

    return promise.then((v) => v.initialConfig)
  }

  reloadConfig () {
    if (this._configResult.state === 'errored' || this._configResult.state === 'loaded') {
      this._configResult = { state: 'pending' }
      debug('reloadConfig refresh')

      return this.initializeConfig()
    }

    if (this._configResult.state === 'loading' || this._configResult.state === 'pending') {
      debug('reloadConfig first load')

      return this.initializeConfig()
    }

    throw new Error(`Unreachable state`)
  }

  loadTestingType () {
    // If we have set a testingType, and it's not the "target" of the
    // registeredEvents (switching testing mode), we need to get a fresh
    // config IPC & re-execute the setupTestingType
    if (this._registeredEventsTarget && this._testingType !== this._registeredEventsTarget) {
      this.reloadConfig().catch(this.onLoadError)
    } else if (this._eventsIpc && !this._registeredEventsTarget && this._configResult.state === 'loaded') {
      this.setupNodeEvents().catch(this.onLoadError)
    }
  }

  private _loadConfig () {
    const dfd = pDeferFulfilled<LoadConfigReply>()
    const child = this.forkConfigProcess()
    const ipc = this.wrapConfigProcess(child, dfd)

    return { promise: dfd.promise, child, ipc }
  }

  private forkConfigProcess () {
    const configProcessArgs = ['--projectRoot', this.options.projectRoot, '--file', this.options.configFilePath]

    const childOptions: ForkOptions = {
      stdio: 'pipe',
      cwd: path.dirname(this.options.configFilePath),
      env: {
        ...process.env,
        NODE_OPTIONS: process.env.ORIGINAL_NODE_OPTIONS || '',
        // DEBUG: '*',
      },
      execPath: this.options.nodePath ?? undefined,
    }

    if (inspector.url()) {
      childOptions.execArgv = _.chain(process.execArgv.slice(0))
      .remove('--inspect-brk')
      .push(`--inspect=${process.debugPort + this._childProcesses.size + 1}`)
      .value()
    }

    debug('fork child process', CHILD_PROCESS_FILE_PATH, configProcessArgs, _.omit(childOptions, 'env'))

    const proc = fork(CHILD_PROCESS_FILE_PATH, configProcessArgs, childOptions)

    this._childProcesses.add(proc)

    return proc
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

    ipc.once('loadConfig:reply', (val) => {
      debug('loadConfig:reply')
      dfd.resolve({ ...val, initialConfig: JSON.parse(val.initialConfig) })
    })

    ipc.once('loadConfig:error', (err) => {
      this.killChildProcess(child)
      dfd.reject(err)
    })

    debug('trigger the load of the file')
    ipc.once('ready', () => {
      ipc.send('loadConfig')
    })

    return ipc
  }

  private handleChildProcessError (err: any, ipc: ProjectConfigIpc, dfd: pDefer.DeferredPromise<any> & {settled: boolean}) {
    debug('plugins process error:', err.stack)

    this._cleanupIpc(ipc)

    err = getError('CONFIG_FILE_UNEXPECTED_ERROR', this.options.configFile || '(unknown config file)', err)
    err.title = 'Config process error'

    // this can sometimes trigger before the promise is fulfilled and
    // sometimes after, so we need to handle each case differently
    if (dfd.settled) {
      this.options.onError(err)
    } else {
      dfd.reject(err)
    }
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
    this._childProcesses.delete(proc)
  }

  private killChildProcess (child: ChildProcess) {
    child.kill()
    child.stdout?.removeAllListeners()
    child.stderr?.removeAllListeners()
    child.removeAllListeners()
  }

  private killChildProcesses () {
    for (const proc of this._childProcesses) {
      this._cleanupProcess(proc)
    }
    this._childProcesses = new Set()
  }

  private validateConfigFile (file: string | false, config: Cypress.ConfigOptions) {
    validateConfig(config, (errMsg) => {
      if (_.isString(errMsg)) {
        throw getError('CONFIG_VALIDATION_MSG_ERROR', 'configFile', file || null, errMsg)
      }

      throw getError('CONFIG_VALIDATION_ERROR', 'configFile', file || null, errMsg)
    })

    return validateNoBreakingConfigLaunchpad(
      config,
      (type, obj) => {
        const error = getError(type, obj)

        this.options.onWarning(error)

        return error
      },
      (type, obj) => {
        const error = getError(type, obj)

        this.options.onError(error)

        throw error
      },
    )
  }

  private onLoadError = (err: any) => {
    if (this.options.isRunMode && this._pendingInitialize) {
      this._pendingInitialize.reject(err)
    } else {
      this.options.onError(err, 'Error Loading Config')
    }
  }

  private watchRequires (groupName: 'config' | 'setupNodeEvents', paths: string[]) {
    if (this.options.isRunMode) {
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
      cwd: this.options.projectRoot,
    })

    this._watchers.add(w)

    return w
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

  private setupNodeEvents (): Promise<SetupNodeEventsReply> {
    assert(this._eventsIpc, 'Expected _eventsIpc to be defined at this point')
    const ipc = this._eventsIpc
    const promise = this.callSetupNodeEventsWithConfig(ipc)

    this._eventsIpcResult = { state: 'loading', value: promise }

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
      this.options.toLaunchpad()
    })
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

    const fullConfig = await this.buildBaseFullConfig(this._configResult.value.initialConfig, this._envFileResult.value, this.options.modeOptions)

    const finalConfig = this._cachedFullConfig = this.options.updateWithPluginValues(fullConfig, result.setupConfig ?? {})

    // This happens automatically with openProjectCreate in run mode
    if (!this.options.isRunMode) {
      if (!this._initializedProject) {
        this._initializedProject = await this.options.initializeActiveProject({})
      } else {
        // TODO: modify the _initializedProject
      }
    }

    // TODO: not sure about where this fits into the refactor
    await this.options.setActiveBrowser()

    this._pendingInitialize?.resolve(finalConfig)

    return result
  }

  private validateConfigRoot (config: Cypress.ConfigOptions) {
    return validateNoBreakingConfigRoot(
      config,
      (type, obj) => {
        return getError(type, obj)
      },
      (type, obj) => {
        throw getError(type, obj)
      },
    )
  }

  private validateTestingTypeConfig (config: Cypress.ConfigOptions, testingType: TestingType) {
    return validateNoBreakingTestingTypeConfig(
      config,
      testingType,
      (type, ...args) => {
        return getError(type, ...args)
      },
      (type, ...args) => {
        throw getError(type, ...args)
      },
    )
  }

  private async buildBaseFullConfig (configFileContents: Cypress.ConfigOptions, envFile: Cypress.ConfigOptions, options: Partial<AllModeOptions>, withBrowsers = true) {
    assert(this._testingType)
    this.validateConfigRoot(configFileContents)

    const testingTypeOverrides = configFileContents[this._testingType] ?? {}
    const optionsOverrides = options.config?.[this._testingType] ?? {}

    this.validateTestingTypeConfig(testingTypeOverrides, this._testingType)
    this.validateTestingTypeConfig(optionsOverrides, this._testingType)

    // TODO: pass in options.config overrides separately, so they are reflected in the UI
    configFileContents = { ...configFileContents, ...testingTypeOverrides, ...optionsOverrides }

    // TODO: Convert this to be synchronous, it's just FS checks
    let fullConfig = await this.options.setupFullConfigWithDefaults({
      cliConfig: options.config ?? {},
      projectName: path.basename(this.options.projectRoot),
      projectRoot: this.options.projectRoot,
      config: _.cloneDeep(configFileContents),
      envFile: _.cloneDeep(envFile),
      options: {
        ...options,
        testingType: this._testingType,
      },
    })

    if (withBrowsers) {
      const browsers = await this.options.machineBrowsers()

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
          warning: browser.warning || getError('CHROME_WEB_SECURITY_NOT_SUPPORTED', browser.name).message,
        }
      })

      // If we have withBrowsers set to false, it means we're coming from the legacy config.get API
      // in tests, which shouldn't be validating the config
      this.validateConfigFile(this.options.configFile, fullConfig)
    }

    return _.cloneDeep(fullConfig)
  }

  private async callSetupNodeEventsWithConfig (ipc: ProjectConfigIpc): Promise<SetupNodeEventsReply> {
    assert(this._testingType)
    const config = await this.getFullInitialConfig()

    assert(config)

    this._registeredEventsTarget = this._testingType

    for (const handler of this.options.handlers) {
      handler(ipc)
    }

    const { promise } = this.registerSetupIpcHandlers(ipc)

    const overrides = config[this._testingType] ?? {}
    const mergedConfig = { ...config, ...overrides }

    // alphabetize config by keys
    let orderedConfig = {} as Cypress.PluginConfigOptions

    Object.keys(mergedConfig).sort().forEach((key) => {
      const k = key as keyof typeof mergedConfig

      // @ts-ignore
      orderedConfig[k] = mergedConfig[k]
    })

    ipc.send('setupTestingType', this._testingType, {
      ...orderedConfig,
      projectRoot: this.options.projectRoot,
      configFile: this.options.configFilePath,
      version: this.options.cypressVersion,
      testingType: this._testingType,
    })

    return promise
  }

  private registerSetupIpcHandlers (ipc: ProjectConfigIpc) {
    const dfd = pDefer<SetupNodeEventsReply>()

    ipc.childProcess.on('error', dfd.reject)

    // For every registration event, we want to turn into an RPC with the child process
    ipc.once('setupTestingType:reply', dfd.resolve)
    ipc.once('setupTestingType:error', (err) => {
      dfd.reject(err)
    })

    const handleWarning = (warningErr: CypressError) => {
      debug('plugins process warning:', warningErr.stack)

      return this.options.onWarning(warningErr)
    }

    ipc.on('warning', handleWarning)

    return dfd
  }

  async getFullInitialConfig (options: Partial<AllModeOptions> = this.options.modeOptions, withBrowsers = true): Promise<FullConfig> {
    if (this._cachedFullConfig) {
      return this._cachedFullConfig
    }

    const [configFileContents, envFile] = await Promise.all([
      this.getConfigFileContents(),
      this.loadCypressEnvFile(),
    ])

    this._cachedFullConfig = await this.buildBaseFullConfig(configFileContents, envFile, options, withBrowsers)

    return this._cachedFullConfig
  }

  async getConfigFileContents () {
    if (this._configResult.state === 'loaded') {
      return this._configResult.value.initialConfig
    }

    return this.initializeConfig()
  }

  loadCypressEnvFile () {
    if (!this.options.hasCypressEnvFile) {
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
      this.options.toLaunchpad()
    })

    this._envFileResult = { state: 'loading', value: promise }

    return promise
  }

  private async readCypressEnvFile (): Promise<Cypress.ConfigOptions> {
    try {
      return await fs.readJSON(this.envFilePath)
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return {}
      }

      if (err.isCypressErr) {
        throw err
      }

      throw getError('ERROR_READING_FILE', this.envFilePath, err)
    }
  }

  async reloadCypressEnvFile () {
    if (this._envFileResult.state === 'loading') {
      return this._envFileResult.value
    }

    this._envFileResult = { state: 'pending' }

    return this.loadCypressEnvFile()
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

  private closeWatchers () {
    for (const watcher of this._watchers.values()) {
      // We don't care if there's an error while closing the watcher,
      // the watch listener on our end is already removed synchronously by chokidar
      watcher.close().catch((e) => {})
    }
    this._watchers = new Set()
  }

  destroy () {
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
    this._cachedFullConfig = undefined
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
