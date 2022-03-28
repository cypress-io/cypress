import { CypressError, getError } from '@packages/errors'
import { IpcHandler, LoadConfigReply, ProjectConfigIpc, SetupNodeEventsReply } from './ProjectConfigIpc'
import assert from 'assert'
import pDefer from 'p-defer'
import type { AllModeOptions, FoundBrowser, FullConfig, TestingType } from '@packages/types'
import debugLib from 'debug'
import { ChildProcess, ForkOptions, fork } from 'child_process'
import path from 'path'
import _ from 'lodash'
import inspector from 'inspector'
import chokidar from 'chokidar'
import { validate as validateConfig, validateNoBreakingConfigLaunchpad, validateNoBreakingConfigRoot, validateNoBreakingTestingTypeConfig } from '@packages/config'
import type { SetupFullConfigOptions } from './ProjectLifecycleManager'
import { CypressEnv } from './CypressEnv'
import { autoBindDebug } from '../util/autoBindDebug'

const debug = debugLib(`cypress:lifecycle:ProjectConfigManager`)

const CHILD_PROCESS_FILE_PATH = require.resolve('@packages/server/lib/plugins/child/require_async_child')

const UNDEFINED_SERIALIZED = '__cypress_undefined__'

type ProjectConfigManagerOptions = {
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
  onInitialConfigLoaded: (initialConfig: Cypress.ConfigOptions) => void
  onFinalConfigLoaded: (finalConfig: FullConfig) => Promise<void>
  updateWithPluginValues: (config: FullConfig, modifiedConfig: Partial<Cypress.ConfigOptions>) => FullConfig
  setupFullConfigWithDefaults: (config: SetupFullConfigOptions) => Promise<FullConfig>
  machineBrowsers: () => FoundBrowser[] | Promise<FoundBrowser[]>
}

type ConfigManagerState = 'pending' | 'loadingConfig' | 'loadedConfig' | 'loadingNodeEvents' | 'ready' | 'errored'

export class ProjectConfigManager {
  private _configFilePath: string | undefined
  private _cachedFullConfig: FullConfig | undefined
  private _childProcesses = new Set<ChildProcess>()
  private _eventsIpc?: ProjectConfigIpc
  private _eventProcess: ChildProcess | undefined
  private _pathToWatcherRecord: Record<string, chokidar.FSWatcher> = {}
  private _watchers = new Set<chokidar.FSWatcher>()
  private _registeredEvents: Record<string, Function> = {}
  private _testingType: TestingType | undefined
  private _state: ConfigManagerState = 'pending'
  private _loadConfigPromise: Promise<LoadConfigReply> | undefined
  private _cachedLoadConfig: LoadConfigReply | undefined
  private _cypressEnv: CypressEnv

  constructor (private options: ProjectConfigManagerOptions) {
    this._cypressEnv = new CypressEnv({
      envFilePath: this.envFilePath,
      validateConfigFile: (filePath, config) => {
        this.validateConfigFile(filePath, config)
      },
      toLaunchpad: (...args) => {
        this.options.toLaunchpad(...args)
      },
    })

    return autoBindDebug(this)
  }

  get isLoadingNodeEvents () {
    return this._state === 'loadingNodeEvents'
  }

  get isReady () {
    return this._state === 'ready'
  }

  get isLoadingConfigFile () {
    return this._state === 'loadingConfig'
  }

  get configFilePath () {
    assert(this._configFilePath)

    return this._configFilePath
  }

  set configFilePath (configFilePath) {
    this._configFilePath = configFilePath
  }

  setTestingType (testingType: TestingType) {
    this._testingType = testingType
  }

  private get envFilePath () {
    return path.join(this.options.projectRoot, 'cypress.env.json')
  }

  private get loadedConfigFile (): Partial<Cypress.ConfigOptions> | null {
    return this._cachedLoadConfig?.initialConfig ?? null
  }

  async initializeConfig (): Promise<LoadConfigReply['initialConfig']> {
    try {
      this._state = 'loadingConfig'
      this._cachedLoadConfig = undefined

      const result = await this.loadConfig()

      // This is necessary as there is a weird timing issue where an error occurs and the config results get loaded
      // TODO: see if this can be !== 'errored'
      if (this._state === 'loadingConfig') {
        debug(`config is loaded for file`, this.configFilePath, this._testingType)
        this.validateConfigFile(this.configFilePath, result.initialConfig)

        this._state = 'loadedConfig'
        this._cachedLoadConfig = result

        this.options.onInitialConfigLoaded(result.initialConfig)
      }

      return result.initialConfig
    } catch (error) {
      debug(`catch %o`, error)
      if (this._eventsIpc) {
        this._cleanupIpc(this._eventsIpc)
      }

      this._state = 'errored'
      this.closeWatchers()

      throw error
    } finally {
      this.options.toLaunchpad()
    }
  }

  loadTestingType () {
    if (this._eventsIpc && this._cachedLoadConfig) {
      this.setupNodeEvents(this._cachedLoadConfig).catch(this.onLoadError)
    }
  }

  private async setupNodeEvents (loadConfigReply: LoadConfigReply): Promise<void> {
    assert(this._eventsIpc, 'Expected _eventsIpc to be defined at this point')
    this._state = 'loadingNodeEvents'

    try {
      const setupNodeEventsReply = await this.callSetupNodeEventsWithConfig(this._eventsIpc)

      await this.handleSetupTestingTypeReply(this._eventsIpc, loadConfigReply, setupNodeEventsReply)
      this._state = 'ready'
    } catch (error) {
      debug(`catch setupNodeEvents %o`, error)
      this._state = 'errored'
      if (this._eventsIpc) {
        this._cleanupIpc(this._eventsIpc)
      }

      this.closeWatchers()

      throw error
    } finally {
      this.options.toLaunchpad()
    }
  }

  private async callSetupNodeEventsWithConfig (ipc: ProjectConfigIpc): Promise<SetupNodeEventsReply> {
    debug('callSetupNodeEvents', this._testingType)
    assert(this._testingType)
    const config = await this.getFullInitialConfig()

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
      configFile: this.configFilePath,
      version: this.options.cypressVersion,
      testingType: this._testingType,
    })

    return promise
  }

  private async handleSetupTestingTypeReply (ipc: ProjectConfigIpc, loadConfigReply: LoadConfigReply, result: SetupNodeEventsReply) {
    this._registeredEvents = {}

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

    const cypressEnv = await this.loadCypressEnvFile()
    const fullConfig = await this.buildBaseFullConfig(loadConfigReply.initialConfig, cypressEnv, this.options.modeOptions)

    const finalConfig = this._cachedFullConfig = this.options.updateWithPluginValues(fullConfig, result.setupConfig ?? {})

    await this.options.onFinalConfigLoaded(finalConfig)

    this.watchFiles([
      ...loadConfigReply.requires,
      ...result.requires,
      this.configFilePath,
      this.envFilePath,
    ])

    return result
  }

  async reloadConfig () {
    this._loadConfigPromise = undefined

    await this.initializeConfig()
    this.loadTestingType()
  }

  private loadConfig () {
    if (!this._loadConfigPromise) {
      // If there's already a dangling IPC from the previous switch of testing type, we want to clean this up
      if (this._eventsIpc) {
        this._cleanupIpc(this._eventsIpc)
      }

      this._eventProcess = this.forkConfigProcess()
      this._loadConfigPromise = this.wrapConfigProcess(this._eventProcess)
    }

    return this._loadConfigPromise
  }

  private forkConfigProcess () {
    const configProcessArgs = ['--projectRoot', this.options.projectRoot, '--file', this.configFilePath]
    // allow the use of ts-node in subprocesses tests by removing the env constant from it
    // without this line, packages/ts/register.js never registers the ts-node module for config and
    // run_plugins can't use the config module.
    const { CYPRESS_INTERNAL_E2E_TESTING_SELF, ...env } = process.env

    env.NODE_OPTIONS = process.env.ORIGINAL_NODE_OPTIONS || ''

    const childOptions: ForkOptions = {
      stdio: 'pipe',
      cwd: path.dirname(this.configFilePath),
      env,
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

  private wrapConfigProcess (child: ChildProcess): Promise<LoadConfigReply> {
    return new Promise((resolve, reject) => {
      // The "IPC" is an EventEmitter wrapping the child process, adding a "send"
      // method, and re-emitting any "message" that comes through the channel through the EventEmitter
      const ipc = new ProjectConfigIpc(child)

      if (child.stdout && child.stderr) {
        // manually pipe plugin stdout and stderr for dashboard capture
        // @see https://github.com/cypress-io/cypress/issues/7434
        child.stdout.on('data', (data) => process.stdout.write(data))
        child.stderr.on('data', (data) => process.stderr.write(data))
      }

      let resolved = false

      child.on('error', (err) => {
        this.handleChildProcessError(err, ipc, resolved, reject)
        reject(err)
      })

      /**
       * This reject cannot be caught anywhere??
       *
       * It's supposed to be caught on lib/modes/run.js:1689,
       * but it's not.
       */
      ipc.on('childProcess:unhandledError', (err) => {
        this.handleChildProcessError(err, ipc, resolved, reject)
        reject(err)
      })

      ipc.once('loadConfig:reply', (val) => {
        debug('loadConfig:reply')
        resolve({ ...val, initialConfig: JSON.parse(val.initialConfig) })
        resolved = true
      })

      ipc.once('loadConfig:error', (err) => {
        this.killChildProcess(child)
        reject(err)
      })

      debug('trigger the load of the file')
      ipc.once('ready', () => {
        ipc.send('loadConfig')
      })

      this._eventsIpc = ipc
    })
  }

  private handleChildProcessError (err: any, ipc: ProjectConfigIpc, resolved: boolean, reject: (reason?: any) => void) {
    debug('plugins process error:', err.stack)

    this._state = 'errored'
    this._cleanupIpc(ipc)

    err = getError('CONFIG_FILE_UNEXPECTED_ERROR', this.options.configFile || '(unknown config file)', err)
    err.title = 'Config process error'

    // this can sometimes trigger before the promise is fulfilled and
    // sometimes after, so we need to handle each case differently
    if (resolved) {
      this.options.onError(err)
    } else {
      reject(err)
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

  onLoadError = (error: any) => {
    this.closeWatchers()
    // TODO: this isn't i18n'd
    this.options.onError(error, 'Error Loading Config')
  }

  private watchFiles (paths: string[]) {
    if (this.options.isRunMode) {
      return
    }

    const filtered = paths.filter((p) => !p.includes('/node_modules/'))

    for (const path of filtered) {
      if (!this._pathToWatcherRecord[path]) {
        this._pathToWatcherRecord[path] = this.addWatcherFor(path)
      }
    }
  }

  private addWatcherFor (file: string) {
    const w = this.addWatcher(file)

    w.on('all', (evt) => {
      debug(`changed ${file}: ${evt}`)
      this.reloadConfig().catch(this.onLoadError)
    })

    w.on('error', (err) => {
      debug('error watching config files %O', err)
      this.options.onWarning(getError('UNEXPECTED_INTERNAL_ERROR', err))
    })

    return w
  }

  private addWatcher (file: string | string[]) {
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
      this.reloadCypressEnvFile(),
    ])

    this._cachedFullConfig = await this.buildBaseFullConfig(configFileContents, envFile, options, withBrowsers)

    return this._cachedFullConfig
  }

  async getConfigFileContents () {
    if (this._cachedLoadConfig?.initialConfig) {
      return this._cachedLoadConfig?.initialConfig
    }

    return this.initializeConfig()
  }

  async loadCypressEnvFile () {
    return this._cypressEnv.loadCypressEnvFile()
  }

  async reloadCypressEnvFile () {
    this._cypressEnv = new CypressEnv({
      envFilePath: this.envFilePath,
      validateConfigFile: (filePath, config) => {
        this.validateConfigFile(filePath, config)
      },
      toLaunchpad: (...args) => {
        this.options.toLaunchpad(...args)
      },
    })

    return this._cypressEnv.loadCypressEnvFile()
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
    this._pathToWatcherRecord = {}
  }

  destroy () {
    if (this._eventsIpc) {
      this._cleanupIpc(this._eventsIpc)
    }

    this.killChildProcesses()
    this._state = 'pending'
    this._cachedLoadConfig = undefined
    this._cachedFullConfig = undefined
    this._eventProcess = undefined
    this.closeWatchers()
  }
}
