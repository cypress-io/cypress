import { CypressError, getError } from '@packages/errors'
import type { AllModeOptions, FoundBrowser, FullConfig, TestingType } from '@packages/types'
import type { IpcHandler, LoadConfigReply, ProjectConfigIpc, SetupNodeEventsReply } from './ProjectConfigIpc'
import debugLib from 'debug'
import { validate as validateConfig, validateNoBreakingConfigLaunchpad, validateNoBreakingConfigRoot, validateNoBreakingTestingTypeConfig } from '@packages/config'
import path from 'path'
import _ from 'lodash'
import chokidar from 'chokidar'
import { autoBindDebug } from '../util/autoBindDebug'
import type { SetupFullConfigOptions } from './ProjectLifecycleManager'

const pkg = require('@packages/root')
const debug = debugLib(`cypress:lifecycle:ProjectFinalConfigManager`)
const UNDEFINED_SERIALIZED = '__cypress_undefined__'

interface ProjectFinalConfigManagerOptions {
  isRunMode: boolean
  configFile: string | false
  projectRoot: string
  modeOptions: Partial<AllModeOptions>
  handlers: IpcHandler[]
  configFilePath: string
  envOptions: Cypress.ConfigOptions
  reloadConfig: () => Promise<void>
  onError: (cypressError: CypressError, title?: string | undefined) => void
  onWarning: (err: CypressError) => void
  setupFullConfigWithDefaults: (config: SetupFullConfigOptions) => Promise<FullConfig>
  updateWithPluginValues: (config: FullConfig, modifiedConfig: Partial<Cypress.ConfigOptions>) => FullConfig
}

export class ProjectFinalConfigManager {
  private _registeredEvents: Record<string, Function> = {}
  private _pathToWatcherRecord: Record<string, chokidar.FSWatcher> = {}

  constructor (private ipc: ProjectConfigIpc, private options: ProjectFinalConfigManagerOptions) {
    return autoBindDebug(this)
  }

  async loadFinalConfigForTestingType (loadConfigReply: LoadConfigReply, testingType: TestingType, browsers: FoundBrowser[]) {
    return this.setupNodeEvents(loadConfigReply, testingType, browsers)
  }

  hasNodeEvent (eventName: string) {
    const isRegistered = typeof this._registeredEvents[eventName] === 'function'

    debug('plugin event registered? %o', { eventName, isRegistered })

    return isRegistered
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

  executeNodeEvent (event: string, args: any[]) {
    debug(`execute plugin event '${event}' Node '${process.version}' with args: %o %o %o`, ...args)

    const evtFn = this._registeredEvents[event]

    if (typeof evtFn !== 'function') {
      throw new Error(`Missing event for ${event}`)
    }

    return evtFn(...args)
  }

  private get envFilePath () {
    return path.join(this.options.projectRoot, 'cypress.env.json')
  }

  private async setupNodeEvents (loadConfigReply: LoadConfigReply, testingType: TestingType, browsers: FoundBrowser[]): Promise<FullConfig> {
    const fullConfig = await this.buildBaseFullConfig(loadConfigReply.initialConfig, testingType, this.options.envOptions, this.options.modeOptions, browsers)
    const setupNodeEventsReply = await this.callSetupNodeEventsWithConfig(this.ipc, fullConfig, testingType, browsers)

    return this.handleSetupTestingTypeReply(this.ipc, loadConfigReply, fullConfig, setupNodeEventsReply)
  }

  private async callSetupNodeEventsWithConfig (ipc: ProjectConfigIpc, config: FullConfig, testingType: TestingType, browsers: FoundBrowser[]): Promise<SetupNodeEventsReply> {
    for (const handler of this.options.handlers) {
      handler(ipc)
    }

    const promise = this.registerSetupIpcHandlers(ipc)

    const overrides = config[testingType] ?? {}
    const mergedConfig = { ...config, ...overrides }

    // alphabetize config by keys
    let orderedConfig = {} as Cypress.PluginConfigOptions

    Object.keys(mergedConfig).sort().forEach((key) => {
      const k = key as keyof typeof mergedConfig

      // @ts-ignore
      orderedConfig[k] = mergedConfig[k]
    })

    ipc.send('setupTestingType', testingType, {
      ...orderedConfig,
      projectRoot: this.options.projectRoot,
      configFile: this.options.configFilePath,
      version: pkg.version,
      testingType,
    })

    return promise
  }

  private registerSetupIpcHandlers (ipc: ProjectConfigIpc) {
    return new Promise<SetupNodeEventsReply>((resolve, reject) => {
      this.ipc.childProcess.on('error', reject)

      // For every registration event, we want to turn into an RPC with the child process
      this.ipc.once('setupTestingType:reply', resolve)

      this.ipc.once('setupTestingType:error', (err) => {
        reject(err)
      })

      const handleWarning = (warningErr: CypressError) => {
        debug('plugins process warning:', warningErr.stack)

        return this.options.onWarning(warningErr)
      }

      this.ipc.on('warning', handleWarning)
    })
  }

  private async buildBaseFullConfig (configFileContents: Cypress.ConfigOptions, testingType: TestingType, envFile: Cypress.ConfigOptions, options: Partial<AllModeOptions>, browsers: FoundBrowser[]) {
    this.validateConfigRoot(configFileContents)

    const testingTypeOverrides = configFileContents[testingType] ?? {}
    const optionsOverrides = options.config?.[testingType] ?? {}

    this.validateTestingTypeConfig(testingTypeOverrides, testingType)
    this.validateTestingTypeConfig(optionsOverrides, testingType)

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
        testingType,
      },
    })

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

    return _.cloneDeep(fullConfig)
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

  private async handleSetupTestingTypeReply (ipc: ProjectConfigIpc, loadConfigReply: LoadConfigReply, fullConfig: FullConfig, result: SetupNodeEventsReply) {
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

    const finalConfig = this.options.updateWithPluginValues(fullConfig, result.setupConfig ?? {})

    this.watchFiles([
      ...loadConfigReply.requires,
      ...result.requires,
      this.options.configFilePath,
      this.envFilePath,
    ])

    return finalConfig
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
    const w = chokidar.watch(file, {
      ignoreInitial: true,
      cwd: this.options.projectRoot,
    })

    w.on('all', (evt) => {
      debug(`changed ${file}: ${evt}`)
      this.options.reloadConfig().catch(this.onLoadError)
    })

    w.on('error', (err) => {
      debug('error watching config files %O', err)
      this.options.onWarning(getError('UNEXPECTED_INTERNAL_ERROR', err))
    })

    return w
  }

  private closeWatchers () {
    for (const watcher of Object.values(this._pathToWatcherRecord)) {
      // We don't care if there's an error while closing the watcher,
      // the watch listener on our end is already removed synchronously by chokidar
      watcher.close().catch((e) => {})
    }
    this._pathToWatcherRecord = {}
  }

  private onLoadError = (error: any) => {
    // TODO: this isn't i18n'd
    this.options.onError(error, 'Error Loading Config')
  }

  destroy () {
    this._registeredEvents = {}
    this.closeWatchers()
  }
}
