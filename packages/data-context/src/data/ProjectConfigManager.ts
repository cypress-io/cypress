import type { AllModeOptions, FoundBrowser, FullConfig, LoadConfigReply, SetupNodeEventsReply, TestingType } from '@packages/types'
import { ChildProcess, fork, ForkOptions } from 'child_process'
import chokidar, { FSWatcher } from 'chokidar'
import path from 'path'
import debugLib from 'debug'
import inspector from 'inspector'
import _ from 'lodash'
import fs from 'fs-extra'
import { CypressError, getError, isCypressErr } from '@packages/errors'
import { DataContext, getCtx } from '..'
import { ProjectConfigIpc } from './ProjectConfigIpc'
import pDefer from 'p-defer'
import assert from 'assert'

const debug = debugLib(`cypress:lifecycle:ProjectLifecycleManager`)
const CHILD_PROCESS_FILE_PATH = require.resolve('@packages/server/lib/plugins/child/require_async_child')
const UNDEFINED_SERIALIZED = '__cypress_undefined__'
const DESTROYED = getError('UNEXPECTED_INTERNAL_ERROR', new Error())

export interface ProjectConfigManagerConfig {
  /**
   * Whether we are currently in "run" (terminal) mode
   */
  isRunMode: boolean
  /**
   * Path to the "root" of the project, the folder containing the
   */
  projectRoot: string
  /**
   * Path to the cypress.config.js or other file containing the Cypress config
   */
  projectConfigPath: string
  /**
   * The current testing type we're targeting when sourcing the config
   */
  currentTestingType: TestingType | null
  /**
   * Externally injected config APIs for validation
   */
  configApis: DataContext['_apis']['configApi']
  /**
   * The machine browsers fetched externally
   */
  machineBrowsers: FoundBrowser[] | Promise<FoundBrowser[]>
  /**
   * Options passed to the CLI & normalized when starting Cypress
   */
  modeOptions: Partial<AllModeOptions>
  /**
   * The node path that we use to spawn the child process
   */
  nodePath?: string
  /**
   * When there is an error, this is how we handle it
   */
  onError: (err: CypressError) => void
  /**
   * When there is an error, this is how we handle it
   */
  onWarning: (warning: CypressError) => void
  /**
   * Re-initialize, optionally giving a reason. The owner of the config manager
   * is responsible for killing the config manager & spawning a new one, but the
   * config process itsself is responsible for broadcasting this change
   */
  triggerRespawn: (reason: { event: string, watchPath: string }) => void
  /**
   * Invoked when we have completed initializing the IPC process
   */
  onReady: (finalConfig: FullConfig) => void
}

/**
 * Manages the "config" process of a Cypress project
 *
 * This is meant to be fully self-contained, torn down when the
 * testing type or project is changed, and handle any errors with the IPC
 */
export class ProjectConfigManager {
  /**
   * Set to true when we complete the "initialize" step,
   * used to determine whether we throw or call the config.onError
   */
  private _hasRunInitialize = false
  private _destroyed: false | CypressError = false
  private envFilePath = path.join(this.config.projectRoot, 'cypress.env.json')
  private _configProcess?: ChildProcess
  private _registeredEvents: Record<string, Function> = {}
  /**
   * Resolved with the result of the "loadConfig" when
   */
  private _loadConfigReply = pDefer<LoadConfigReply>()
  private _setupNodeEventsReply = pDefer<SetupNodeEventsReply>()
  private _testingType = this.config.currentTestingType
  private _ipc?: ProjectConfigIpc
  private _ipcReady = false

  constructor (
    private config: ProjectConfigManagerConfig,
  ) {
    process.on('exit', this.destroy)
  }

  get projectRoot () {
    return this.config.projectRoot
  }

  get testingType () {
    return this._testingType
  }

  get isIpcReady () {
    return this._ipcReady
  }

  get isInitialized () {
    return Boolean(this._hasRunInitialize)
  }

  get eventProcessPid () {
    return this._configProcess?.pid
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

  /**
   * Equivalent / used in the legacy "config.get()"
   * which is used in various legacy tests we need to remove or refactor.
   * This sources a validated config prior to the excecution of the setupNodeEvents
   */
  async getFullInitialConfig (options: Partial<AllModeOptions> = this.config.modeOptions, withBrowsers = true): Promise<FullConfig> {
    const [configFile, envConfig] = await Promise.all([
      this.sourceConfig(),
      this.loadEnvFile(),
    ])

    return this.buildBaseFullConfig(configFile.initialConfig, envConfig, options, withBrowsers)
  }

  /**
   * Returns the "final" config, after the
   */
  getFullFinalConfig = _.once(async () => {
    const fullConfig = await this.getFullInitialConfig()
    const result = await this._setupNodeEventsReply.promise

    return this.config.configApis.updateWithPluginValues(
      fullConfig,
      result.setupConfig ?? {},
    )
  })

  /**
   * Ensure that "initialize" is only called once
   */
  initialize = _.once(() => {
    return this._initialize()
  })

  private async _initialize () {
    try {
      this.setupInitialFileWatchers()

      // 1. Load the initial config file, this will give us the requires we need to watch
      //    for updates, and any errors that happen when validating the config
      const [sourcedConfig] = await Promise.all([
        this.sourceConfig(),
        this.getFullInitialConfig(),
      ])

      // After each async step, check if we've called .destroy() elsewhere, and if so we exit
      if (this._destroyed) {
        return Promise.reject(this._destroyed)
      }

      // Setup the file watchers for any "requires" from the config
      this.setupFileWatchers(sourcedConfig.requires)

      try {
        // 3. If we have the testing type, kickoff the asynchronous sourcing of the config
        if (this._testingType) {
          await this.callSetupNodeEvents()

          return this.getFullFinalConfig()
        }

        return this.getFullInitialConfig()
      } finally {
        this._hasRunInitialize = true
      }
    } catch (e) {
      let err = e

      if (!isCypressErr(e)) {
        err = getError('UNEXPECTED_INTERNAL_ERROR', e)
      }

      throw err
    }
  }

  private watchers = new Map<string, FSWatcher>()

  /**
   * Adds the initial file watchers on the files that we
   * are sourcing config from.
   */
  private setupInitialFileWatchers () {
    this.setupFileWatchers([
      this.config.projectConfigPath,
      this.envFilePath,
    ])
  }

  /**
   * Adds the "dependency" file watchers, things that
   * are required from the child process during config
   */
  private setupFileWatchers (filePaths: string[]) {
    for (const filePath of filePaths) {
      if (!this.watchers.has(filePath)) {
        const watcher = chokidar.watch(filePath, {
          ignoreInitial: true,
        })
        const onFilesChanged = _.debounce((evtName: string, watchPath: string) => {
          this.config.triggerRespawn({
            event: evtName,
            watchPath,
          })
        }, 100, { maxWait: 2000 })

        watcher.on('all', onFilesChanged)
        this.watchers.set(filePath, watcher)
      }
    }
  }

  setCurrentTestingType (currentTestingType: TestingType) {
    if (this._destroyed) {
      return
    }

    assert(!this._testingType, 'We already have a testing type set. We should not be calling this')
    this._testingType = currentTestingType
    this.callSetupNodeEvents().catch(this.config.onError)
  }

  destroy = (reason = DESTROYED) => {
    this._configProcess?.stdout?.removeAllListeners()
    this._configProcess?.stderr?.removeAllListeners()
    this._ipc?.destroy()
    this._configProcess?.kill()
    process.off('exit', this.destroy)
    this._destroyed = reason
    this._configProcess?.removeAllListeners()
    for (const watcher of this.watchers.values()) {
      // Close the watcher & don't worry about any errors that happen
      // while closing, there's nothing we can do about them
      watcher.close().catch(() => {})
    }
  }

  /**
   * Load the cypress.env.json file
   */
  private loadEnvFile = _.once(async () => {
    try {
      const json = await fs.readJSON(this.envFilePath)

      this.validateConfigFile(this.envFilePath, json)

      return json
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return {}
      }

      if (err.isCypressErr) {
        throw err
      }

      throw getError('ERROR_READING_FILE', this.envFilePath, err)
    }
  })

  /**
   * Sources the config by creating a child process for the cypress.config.js
   * and returning what we resolve. Wraps the function in a _.once to ensure the
   * result is memoized for multiple calls
   */
  private sourceConfig = _.once(() => {
    this._configProcess = this.forkConfigProcess()
    this.wrapConfigProcessIpc(this._configProcess)

    return this._loadConfigReply.promise
  })

  /**
   * Calls fork() on the config process we're using to source the Cypress config
   */
  private forkConfigProcess () {
    const configProcessArgs = ['--projectRoot', this.config.projectRoot, '--file', this.config.projectConfigPath]

    const childOptions: ForkOptions = {
      stdio: 'pipe',
      cwd: path.dirname(this.config.projectConfigPath),
      env: {
        ...process.env,
        NODE_OPTIONS: process.env.ORIGINAL_NODE_OPTIONS || '',
        // DEBUG: '*',
      },
      execPath: this.config.nodePath ?? undefined,
    }

    if (inspector.url()) {
      childOptions.execArgv = _.chain(process.execArgv.slice(0))
      .remove('--inspect-brk')
      .push(`--inspect=${process.debugPort + 1}`)
      .value()
    }

    debug('fork child process', CHILD_PROCESS_FILE_PATH, configProcessArgs, _.omit(childOptions, 'env'))

    const proc = fork(CHILD_PROCESS_FILE_PATH, configProcessArgs, childOptions)

    // Add handlers for the event process
    proc.on('error', this.onEventError)
    proc.on('exit', this.onChildExit)

    return proc
  }

  /**
   * The "IPC" is an EventEmitter wrapping the child process, adding a "send"
   * method, and re-emitting any "message" that comes through the channel through the EventEmitter
   *
   * @param child
   * @returns
   */
  private wrapConfigProcessIpc (child: ChildProcess) {
    const ipc = new ProjectConfigIpc(child)

    ipc.once('error', this.onEventError)

    if (child.stdout && child.stderr) {
      // manually pipe plugin stdout and stderr for dashboard capture
      // @see https://github.com/cypress-io/cypress/issues/7434
      child.stdout.on('data', (data) => process.stdout.write(data))
      child.stderr.on('data', (data) => process.stderr.write(data))
    }

    /**
     * This reject cannot be caught anywhere??
     *
     * It's supposed to be caught on lib/modes/run.js:1689,
     * but it's not.
     */
    ipc.on('childProcess:unhandledError', this.onError)

    ipc.once('setupTestingType:reply', this._setupNodeEventsReply.resolve)
    ipc.once('setupTestingType:error', this._setupNodeEventsReply.reject)

    ipc.once('loadConfig:reply', (val) => {
      this._loadConfigReply.resolve({
        ...val,
        initialConfig: JSON.parse(val.initialConfig),
      })
    })

    ipc.once('loadConfig:error', this.onError)

    debug('trigger the load of the file')
    ipc.once('ready', () => {
      ipc.send('loadConfig')
    })

    return ipc
  }

  /**
   * If the child process errors, we need to handle it & rewrap as a cypress errror
   */
  private onEventError = (err: Error) => {
    this.onError(getError('CONFIG_FILE_UNEXPECTED_ERROR', this.config.projectConfigPath, err, this.config.isRunMode))
  }

  /**
   * If the child process exits and we weren't expecting it... we need to
   * consider it an error
   */
  private onChildExit = (exitCode: number) => {
    if (this._destroyed) {
      return
    }

    this.onError(getError('CONFIG_FILE_UNEXPECTED_EXIT', exitCode))
  }

  /**
   * Any errors should funnel through here, "destroy"
   */
  private onError = (err: CypressError) => {
    if (this._destroyed) {
      return
    }

    this.destroy()

    // If we've not yet full initialized, it means we're in the Promise block of the
    // "initialize" call and we can just re-throw the error to have it caught there.
    // Otherwise we need to call the onError that was passed in, and have the ProjectLifecycleManager
    // take care of the error propagation
    if (!this._hasRunInitialize) {
      throw err
    }

    this.config.onError(err)
  }

  private async callSetupNodeEvents () {
    if (this._destroyed) {
      return
    }

    const ipc = this._ipc
    const { initialConfig } = await this.sourceConfig()

    assert(this._testingType)
    assert(ipc)

    // For every registration event, we want to turn into an RPC with the child process
    for (const handler of this.config.configApis.getServerPluginHandlers()) {
      handler(ipc)
    }

    const overrides = initialConfig[this._testingType] ?? {}
    const mergedConfig = { ...initialConfig, ...overrides }

    // alphabetize config by keys
    let orderedConfig = {} as Cypress.PluginConfigOptions

    Object.keys(mergedConfig).sort().forEach((key) => {
      const k = key as keyof typeof mergedConfig

      // @ts-ignore
      orderedConfig[k] = mergedConfig[k]
    })

    ipc.send('setupTestingType', this._testingType, {
      ...orderedConfig,
      projectRoot: this.config.projectRoot,
      configFile: this.config.projectConfigPath,
      version: this.config.configApis.cypressVersion,
      testingType: this._testingType,
    })

    const result = await this._setupNodeEventsReply.promise

    const finalConfig = await this.handleSetupTestingTypeReply(result)

    this._ipcReady = true

    // finalConfig is not returned if the manager has been destroyed
    if (finalConfig) {
      this.config.onReady(finalConfig)
    }
  }

  /**
   * Validates the shape of a "config" shaped object
   */
  private validateConfigFile (filePath: string | false, config: Cypress.ConfigOptions) {
    this.config.configApis.validateConfig(config, (errMsg) => {
      if (_.isString(errMsg)) {
        throw getError('CONFIG_VALIDATION_MSG_ERROR', 'configFile', filePath || null, errMsg)
      }

      throw getError('CONFIG_VALIDATION_ERROR', 'configFile', filePath || null, errMsg)
    })
  }

  /**
   * A mammoth helper function, this takes:
   *
   * - the config contents resolved from the config child process
   * - the JSON from the env file (if any)
   * - any of the execution "mode" options
   * - a boolean for the legacy tests which lets us know whether to add the machine browsers
   *
   * We take these, do a little validation, and return with a "FullConfig" object that we will
   * use
   */
  private async buildBaseFullConfig (
    configFileContents: Cypress.ConfigOptions,
    envFile: Cypress.ConfigOptions,
    options: Partial<AllModeOptions>,
    withBrowsers = true,
  ): Promise<FullConfig> {
    this.validateConfigRoot(configFileContents)

    if (this._testingType) {
      const testingTypeOverrides = configFileContents[this._testingType] ?? {}
      const optionsOverrides = options.config?.[this._testingType] ?? {}

      this.validateTestingTypeConfig(this._testingType, testingTypeOverrides)
      this.validateTestingTypeConfig(this._testingType, optionsOverrides)

      // TODO: pass in options.config overrides separately, so they are reflected in the UI
      configFileContents = {
        ...configFileContents,
        ...testingTypeOverrides,
        ...optionsOverrides,
      }
    }

    // TODO: Convert this to be synchronous, it's just FS checks
    let fullConfig = await this.config.configApis.setupFullConfigWithDefaults({
      cliConfig: options.config ?? {},
      projectName: path.basename(this.config.projectRoot),
      projectRoot: this.config.projectRoot,
      config: _.cloneDeep(configFileContents),
      envFile: _.cloneDeep(envFile),
      options: {
        ...options,
        testingType: this._testingType ?? 'e2e',
      },
    })

    if (withBrowsers) {
      const browsers = await this.config.machineBrowsers

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
      this.validateConfigFile(this.config.projectConfigPath, fullConfig)
    }

    return _.cloneDeep(fullConfig)
  }

  /**
   * Processes the result of the "setupNodeEvents", to complete initializing the project & kickoff
   * @param result
   * @returns
   */
  private async handleSetupTestingTypeReply (result: SetupNodeEventsReply) {
    this._registeredEvents = {}
    this.setupFileWatchers(result.requires)

    for (const { event, eventId } of result.registrations) {
      debug('register plugins process event', event, 'with id', eventId)

      this.registerEvent(event, (...args: any[]) => {
        return new Promise((resolve, reject) => {
          const invocationId = _.uniqueId('inv')

          debug('call event', event, 'for invocation id', invocationId)

          this._ipc?.once(`promise:fulfilled:${invocationId}`, (err: any, value: any) => {
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

          this._ipc?.send('execute:plugins', event, ids, args)
        })
      })
    }

    const fullConfig = await this.getFullInitialConfig()

    if (this._destroyed) {
      return
    }

    return this.config.configApis.updateWithPluginValues(
      fullConfig,
      result.setupConfig ?? {},
    )
  }

  /**
   * Validates the config, at the root level, not scoped to a specific testing type
   */
  private validateConfigRoot (config: Cypress.ConfigOptions) {
    return this.config.configApis.validateRootConfigBreakingChanges(
      config,
      getError,
      (type, obj) => {
        throw getError(type, obj)
      },
    )
  }

  /**
   * Validates the config merged to a given testing type
   */
  private validateTestingTypeConfig (testingType: TestingType, config: Cypress.ConfigOptions) {
    return this.config.configApis.validateTestingTypeConfigBreakingChanges(
      config,
      testingType,
      getError,
      (type, ...args) => {
        throw getError(type, ...args)
      },
    )
  }

  /**
   * Register an event handler w/ the child process
   * @param event
   * @param callback
   */
  private registerEvent (event: string, callback: Function) {
    debug(`register event '${event}'`)

    if (!_.isString(event)) {
      throw new Error(`The plugin register function must be called with an event as its 1st argument. You passed '${event}'.`)
    }

    if (!_.isFunction(callback)) {
      throw new Error(`The plugin register function must be called with a callback function as its 2nd argument. You passed '${callback}'.`)
    }

    this._registeredEvents[event] = callback
  }

  static stubConfig = makeStubConfigManagerOptions
}

export function makeStubConfigManagerOptions (projectRoot: string, opts: Partial<ProjectConfigManagerConfig> = {}): ProjectConfigManagerConfig {
  return {
    isRunMode: true,
    projectRoot,
    projectConfigPath: 'cypress.config.js',
    machineBrowsers: [],
    onError: getCtx().onError,
    onReady () {},
    triggerRespawn () {},
    modeOptions: {},
    onWarning: getCtx().onWarning,
    currentTestingType: null,
    configApis: getCtx()._apis.configApi,
    ...opts,
  }
}
