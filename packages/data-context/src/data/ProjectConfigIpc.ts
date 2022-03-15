/* eslint-disable no-dupe-class-members */
import { CypressError, getError } from '@packages/errors'
import type { AllModeOptions, FoundBrowser, FullConfig, TestingType } from '@packages/types'
import { ChildProcess, fork, ForkOptions } from 'child_process'
import { validate as validateConfig, validateNoBreakingConfigLaunchpad, validateNoBreakingConfigRoot, validateNoBreakingTestingTypeConfig } from '@packages/config'
import EventEmitter from 'events'
import path from 'path'
import inspector from 'inspector'
import _ from 'lodash'
import debugLib from 'debug'
import type { FSWatcher } from 'chokidar'
import chokidar from 'chokidar'
import fs from 'fs-extra'
import pDefer from 'p-defer'
import type { SetupFullConfigOptions } from './ProjectLifecycleManager'

const pkg = require('@packages/root') as typeof import('cypress/package.json')

const debug = debugLib('cypress:lifecycle:ProjectConfigIpc')
const CHILD_PROCESS_FILE_PATH = require.resolve('@packages/server/lib/plugins/child/require_async_child')
const UNDEFINED_SERIALIZED = '__cypress_undefined__'

export type IpcHandler = (ipc: ProjectConfigIpc) => void

export interface SetupTestingTypeReply {
  setupConfig: Cypress.ConfigOptions | null
  requires: string[]
  registrations: Array<{event: string, eventId: string}>
}

export interface LoadConfigReply {
  initialConfig: Cypress.ConfigOptions
  requires: string[]
}

export interface SerializedLoadConfigReply {
  initialConfig: string // stringified Cypress.ConfigOptions
  requires: string[]
}

export interface FileChange {
  evt: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir'
  filePath: string
}

export interface ProjectConfigIpcOptions {
  watch?: boolean // default true
  isRunMode: boolean
  projectRoot: string
  configFile: string
  nodePath?: string | null
  modeOptions: Partial<AllModeOptions>
  handlers: IpcHandler[]
  browsers: FoundBrowser[] | Promise<FoundBrowser[]>
  onError: (err: CypressError) => void
  onWarning: (err: CypressError) => void
  onResolvedConfig?: (cfg: Partial<Cypress.ResolvedConfigOptions>) => void
  onInitialFullConfig?: (cfg: FullConfig) => void
  onFileChange?: (evt: FileChange) => void
  onIpcReady?: (cfg: FullConfig) => void

  // Injected from the /server package beacuse they're pretty gnarly & not type-safe.
  // Revisit these in the future
  setupFullConfigWithDefaults(config: SetupFullConfigOptions): Promise<FullConfig>
  updateWithPluginValues(config: FullConfig, modifiedConfig: Partial<Cypress.ConfigOptions>): FullConfig
}

/**
 * The ProjectConfigIpc is an EventEmitter wrapping the childProcess,
 * adding a "send" method for sending events from the parent process into the childProcess,
 */
export class ProjectConfigIpc {
  #ee = new EventEmitter()
  #childProcess: ChildProcess
  #loadConfigReply = pDefer<LoadConfigReply>()
  #registeredEvents: Record<string, Function> = {}
  #requireWatchers: Record<string, FSWatcher> = {}
  #state: 'pending' | 'loadingConfig' | 'loadedConfig' | 'loadingNodeEvents' | 'ready' | 'destroyed' | 'errored' = 'pending'
  #testingType?: TestingType

  get state () {
    return this.#state
  }

  get pid () {
    return this.#childProcess.pid
  }

  constructor (private options: ProjectConfigIpcOptions) {
    this.#verifyProjectRoot(options.projectRoot)

    const child = this.#childProcess = this.#forkConfigProcess()

    process.on('exit', this.#onProcessExit)
    child.on('message', (msg: { event: string, args: any[] }) => {
      this.emit(msg.event, ...msg.args)
    })

    child.once('disconnect', () => {
      if (!this.#destroyed) {
        this.#onError(getError('CONFIG_FILE_UNEXPECTED_EXIT', child.exitCode ?? -1, this.options.isRunMode))
      }
    })

    if (child.stdout && child.stderr) {
      // manually pipe plugin stdout and stderr for dashboard capture
      // @see https://github.com/cypress-io/cypress/issues/7434
      child.stdout.on('data', (data) => process.stdout.write(data))
      child.stderr.on('data', (data) => process.stderr.write(data))
    }

    child.on('exit', (exitCode) => {
      if (!this.#destroyed) {
        this.#onError(getError('CONFIG_FILE_UNEXPECTED_EXIT', exitCode ?? child.exitCode ?? 0, this.options.isRunMode))
      }
    })

    child.on('error', this.#onError)
    this.on('childProcess:unhandledError', this.#onError)
    this.on('warning', this.options.onWarning)

    this.once('loadConfig:reply', (val: SerializedLoadConfigReply) => {
      this.#loadConfigReply.resolve({ ...val, initialConfig: JSON.parse(val.initialConfig) })
    })

    this.once('loadConfig:error', this.#onError)

    this.once('setupTestingType:error', this.#onError)

    debug('trigger the load of the file')

    this.#state = 'loadingConfig'
    this.once('ready', () => {
      this.send('loadConfig')
    })
  }

  /**
   * Config = cypress.env.json + cypress.config.{js,ts} +
   */
  async initializeConfig () {
    try {
      const [cypressEnvConfig, configFileContents, machineBrowsers] = await Promise.all([
        this.#readCypressEnvFile(),
        this.getConfigFileContents(),
        this.options.browsers,
      ])

      validateNoBreakingConfigLaunchpad(
        configFileContents,
        (type, obj) => {
          const error = getError(type, obj)

          this.options.onWarning(error)

          return error
        },
        (type, obj) => {
          const error = getError(type, obj)

          return this.#onError(error) as never
        },
      )

      if (!this.#destroyed) {
        this.options.onResolvedConfig?.(configFileContents)
      }

      return {
        configFileContents,
        cypressEnvConfig,
        machineBrowsers,
      }
    } catch (e) {
      this.#onError(e)

      return null
    }
  }

  getFullInitialConfig (
    options: Partial<AllModeOptions> = this.options.modeOptions,
    withBrowsers = true,
  ) {
    //
  }

  async setTestingType (testingType: TestingType) {
    if (this.#destroyed) {
      return
    }

    if (this.#testingType) {
      return this.#onError(getError('UNEXPECTED_INTERNAL_ERROR', new Error('Already set testingType')))
    }

    this.#testingType = testingType
    try {
      const result = await this.initializeConfig()

      if (!result) {
        return // process killed
      }

      const fullConfig = await this.#buildBaseFullConfig(
        testingType,
        result.configFileContents,
        result.cypressEnvConfig,
        this.options.modeOptions,
      )

      if (this.#destroyed) {
        return
      }

      this.options.onInitialFullConfig?.(fullConfig)
      this.#state = 'loadedConfig'

      this.once('setupTestingType:reply', (reply) => {
        this.#handleSetupTestingTypeReply(reply, testingType, fullConfig)
      })

      this.#state = 'loadingNodeEvents'
      this.#callSetupTestingTypeWithConfig(
        fullConfig,
        testingType,
      )
    } catch {
      //
    }
  }

  async getConfigFileContents () {
    const { initialConfig } = await this.#loadConfigReply.promise

    validateNoBreakingConfigRoot(
      initialConfig,
      getError,
      (type, obj) => {
        throw getError(type, obj)
      },
    )

    return initialConfig
  }

  // TODO: options => Cypress.TestingTypeOptions
  send(event: 'execute:plugins', evt: string, ids: {eventId: string, invocationId: string}, args: any[]): boolean
  send(event: 'setupTestingType', testingType: TestingType, options: Cypress.PluginConfigOptions): boolean
  send(event: 'loadConfig'): boolean
  send (event: string, ...args: any[]) {
    if (this.#destroyed || this.#childProcess.killed) {
      return false
    }

    try {
      return this.#childProcess.send({ event, args })
    } catch (e) {
      this.#onError(e)

      return false
    }
  }

  on(evt: 'childProcess:unhandledError', listener: (err: CypressError) => void): void
  on(evt: 'warning', listener: (warningErr: CypressError) => void): void
  on (evt: string, listener: (...args: any) => void) {
    this.#ee.on(evt, listener)
  }

  once(evt: `promise:fulfilled:${string}`, listener: (err: any, value: any) => void): void

  /**
   * When the config is loaded, it comes back with either a "reply", or an "error" if there was a problem
   * sourcing the config (script error, etc.)
   */
  once(evt: 'ready', listener: () => void): void
  once(evt: 'loadConfig:reply', listener: (payload: SerializedLoadConfigReply) => void): void
  once(evt: 'loadConfig:error', listener: (err: CypressError) => void): void

  /**
   * When
   */
  once(evt: 'setupTestingType:reply', listener: (payload: SetupTestingTypeReply) => void): void
  once(evt: 'setupTestingType:error', listener: (error: CypressError) => void): void
  once (evt: string, listener: (...args: any[]) => void) {
    this.#ee.once(evt, listener)
  }

  emit (evt: string, ...args: any[]) {
    this.#ee.emit(evt, ...args)
  }

  #onError = (err: CypressError) => {
    debug('plugins process error:', err.stack)
    // If we've already errored once for this process, we don't need to error again
    if (this.#destroyed) {
      debug('ipc already destroyed, returning')

      return
    }

    err = getError('CONFIG_FILE_UNEXPECTED_ERROR', this.options.configFile || '(unknown config file)', err, this.options.isRunMode)
    err.title = 'Config process error'
    this.options.onError(err)
    this.destroy()
    this.#state = 'errored'
  }

  #destroyed = false

  destroy () {
    if (this.#destroyed) return

    debug(`Destroying child process PID %d`, this.#childProcess.pid)

    this.#state = 'destroyed'
    process.off('exit', this.#onProcessExit)
    this.#destroyed = true
    this.#childProcess.kill()
    this.#childProcess.stdout?.removeAllListeners()
    this.#childProcess.stderr?.removeAllListeners()
    this.#childProcess.removeAllListeners()
    for (const watcher of Object.values(this.#requireWatchers)) {
      // Don't worry about any errors closing the watcher, not important to catch
      watcher.close().catch(() => {})
    }
  }

  hasNodeEvent (eventName: string) {
    const isRegistered = typeof this.#registeredEvents[eventName] === 'function'

    debug('plugin event registered? %o', { eventName, isRegistered })

    return isRegistered
  }

  executeNodeEvent (event: string, args: any[]) {
    debug(`execute plugin event '${event}' Node '${process.version}' with args: %o %o %o`, ...args)

    const evtFn = this.#registeredEvents[event]

    if (typeof evtFn !== 'function') {
      throw new Error(`Missing event for ${event}`)
    }

    return evtFn(...args)
  }

  // Private members:

  #forkConfigProcess () {
    const configProcessArgs = ['--projectRoot', this.options.projectRoot, '--file', path.resolve(this.options.projectRoot, this.options.configFile)]

    const childOptions: ForkOptions = {
      stdio: 'pipe',
      cwd: this.options.projectRoot,
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
      .push(`--inspect=${process.debugPort + 1}`)
      .value()
    }

    debug('fork child process', CHILD_PROCESS_FILE_PATH, configProcessArgs, _.omit(childOptions, 'env'))

    return fork(CHILD_PROCESS_FILE_PATH, configProcessArgs, childOptions)
  }

  // When we get the reply from setupTestingType
  async #handleSetupTestingTypeReply (result: SetupTestingTypeReply, testingType: TestingType, fullConfig: FullConfig) {
    debug('handleSetupTestingTypeReply %s %o', testingType, result)

    if (this.#destroyed) {
      return
    }

    this.#watchRequires(result.requires)

    for (const { event, eventId } of result.registrations) {
      debug('register plugins process event', event, 'with id', eventId)

      this.#registerEvent(event, (...args: any[]) => {
        return new Promise((resolve, reject) => {
          const invocationId = _.uniqueId('inv')

          debug('call event', event, 'for invocation id', invocationId)

          this.once(`promise:fulfilled:${invocationId}`, (err: any, value: any) => {
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

          this.send('execute:plugins', event, ids, args)
        })
      })
    }

    const finalConfig = this.options.updateWithPluginValues(fullConfig, result.setupConfig ?? {})

    this.options.onIpcReady?.(finalConfig)
    this.#state = 'ready'
  }

  #registerEvent (event: string, callback: Function) {
    debug(`register event '${event}'`)

    if (!_.isString(event)) {
      throw new Error(`The plugin register function must be called with an event as its 1st argument. You passed '${event}'.`)
    }

    if (!_.isFunction(callback)) {
      throw new Error(`The plugin register function must be called with a callback function as its 2nd argument. You passed '${callback}'.`)
    }

    this.#registeredEvents[event] = callback
  }

  // Given a set of paths, adds a "watcher" for them
  #watchRequires (paths: string[]) {
    if (this.options.isRunMode || this.options.watch === false || this.#destroyed) {
      return
    }

    const filtered = paths.filter((p) => !p.includes('/node_modules/'))

    for (const path of filtered) {
      if (!this.#requireWatchers[path]) {
        const watcher = this.#requireWatchers[path] = chokidar.watch(path, {
          ignoreInitial: true,
          cwd: this.options.projectRoot,
        })

        watcher.on('all', (evt, filePath) => {
          if (!this.#destroyed) {
            this.options.onFileChange?.({ evt, filePath })
          }
        })

        watcher.on('error', () => {
          // Don't worry about errors on the file watching, it's not a huge deal
        })
      }
    }
  }

  #onProcessExit = () => {
    this.#childProcess.kill()
    this.destroy()
  }

  #validateTestingTypeConfig (config: Cypress.ConfigOptions, testingType: TestingType) {
    return validateNoBreakingTestingTypeConfig(
      config,
      testingType,
      getError,
      (type, ...args) => {
        throw getError(type, ...args)
      },
    )
  }

  /**
   * Initializes the config by reading the config file, if we
   * know we have one for the project
   */
  async #readCypressEnvFile (): Promise<Cypress.ConfigOptions> {
    const envFilePath = path.join(this.options.projectRoot, 'cypress.env.json')

    if (this.options.watch !== false) {
      this.#watchRequires([envFilePath])
    }

    try {
      return await fs.readJSON(envFilePath)
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return {}
      }

      if (err.isCypressErr) {
        throw err
      }

      throw getError('ERROR_READING_FILE', envFilePath, err)
    }
  }

  #callSetupTestingTypeWithConfig (fullInitialConfig: FullConfig, testingType: TestingType) {
    for (const handler of this.options.handlers) {
      handler(this)
    }
    const overrides = fullInitialConfig[testingType] ?? {}
    const mergedConfig = { ...fullInitialConfig, ...overrides }

    // alphabetize config by keys
    let orderedConfig = {} as Cypress.PluginConfigOptions

    Object.keys(mergedConfig).sort().forEach((key) => {
      const k = key as keyof typeof mergedConfig

      // @ts-ignore
      orderedConfig[k] = mergedConfig[k]
    })

    this.send('setupTestingType', testingType, {
      ...orderedConfig,
      projectRoot: this.options.projectRoot,
      configFile: path.resolve(this.options.projectRoot, this.options.configFile),
      version: pkg.version,
      testingType,
    })
  }

  #verifyProjectRoot (root: string) {
    try {
      if (!fs.statSync(root).isDirectory()) {
        throw new Error('NOT DIRECTORY')
      }
    } catch (err) {
      throw getError('NO_PROJECT_FOUND_AT_PROJECT_ROOT', root)
    }
  }

  async #buildBaseFullConfig (
    testingType: TestingType,
    configFileContents: Cypress.ConfigOptions,
    envFile: Cypress.ConfigOptions,
    options: Partial<AllModeOptions>,
    withBrowsers = true,
  ) {
    let finalConfigFileContents = configFileContents

    const testingTypeOverrides = configFileContents[testingType] ?? {}
    const optionsOverrides = options.config?.[testingType] ?? {}

    this.#validateTestingTypeConfig(testingTypeOverrides, testingType)
    this.#validateTestingTypeConfig(optionsOverrides, testingType)

    // TODO: pass in options.config overrides separately, so they are reflected in the UI
    finalConfigFileContents = {
      ...configFileContents,
      ...testingTypeOverrides,
      ...optionsOverrides,
    }

    // TODO: Convert this to be synchronous, it's just FS checks
    let fullConfig = await this.options.setupFullConfigWithDefaults({
      cliConfig: options.config ?? {},
      projectName: path.basename(this.options.projectRoot),
      projectRoot: this.options.projectRoot,
      config: _.cloneDeep(finalConfigFileContents),
      envFile: _.cloneDeep(envFile),
      options: {
        ...options,
        testingType,
      },
    })

    if (withBrowsers) {
      const browsers = await this.options.browsers

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
      validateConfig(fullConfig, (errMsg) => {
        if (_.isString(errMsg)) {
          throw getError('CONFIG_VALIDATION_MSG_ERROR', 'configFile', this.options.configFile || null, errMsg)
        }

        throw getError('CONFIG_VALIDATION_ERROR', 'configFile', this.options.configFile || null, errMsg)
      })
    }

    return _.cloneDeep(fullConfig)
  }
}
