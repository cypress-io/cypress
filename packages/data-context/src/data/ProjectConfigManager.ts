import { CypressError, getError } from '@packages/errors'
import type { IpcHandler, LoadConfigReply } from './ProjectConfigIpc'
import assert from 'assert'
import type { AllModeOptions, FoundBrowser, FullConfig, TestingType } from '@packages/types'
import debugLib from 'debug'
import path from 'path'
import _ from 'lodash'
import { validate as validateConfig, validateNoBreakingConfigLaunchpad, validateNoBreakingConfigRoot, validateNoBreakingTestingTypeConfig } from '@packages/config'
import type { SetupFullConfigOptions } from './ProjectLifecycleManager'
import { CypressEnv } from './CypressEnv'
import { autoBindDebug } from '../util/autoBindDebug'
import { ProjectInitialConfigManager } from './ProjectInitConfigManager'
import { ProjectFinalConfigManager } from './ProjectFinalConfigManager'

const debug = debugLib(`cypress:lifecycle:ProjectConfigManager`)

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
  machineBrowsers: () => Promise<FoundBrowser[]>
}

type ConfigManagerState = 'pending' | 'loadingConfig' | 'loadedConfig' | 'loadingNodeEvents' | 'ready' | 'errored'

export class ProjectConfigManager {
  private _configFilePath: string | undefined
  private _cachedFullConfig: FullConfig | undefined
  private _testingType: TestingType | undefined
  private _state: ConfigManagerState = 'pending'
  private _cachedLoadConfig: LoadConfigReply | undefined
  private _cypressEnv: CypressEnv
  private _projectInitialConfigManager: ProjectInitialConfigManager | undefined
  private _projectFinalConfigManager: ProjectFinalConfigManager | undefined

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
      this._projectInitialConfigManager = new ProjectInitialConfigManager({
        configFile: this.options.configFile,
        configFilePath: this.configFilePath,
        nodePath: this.options.nodePath,
        projectRoot: this.options.projectRoot,
        onError: this.options.onError,
      })

      const result = await this._projectInitialConfigManager.loadConfig()

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
      this._projectInitialConfigManager?.destroy()

      this._state = 'errored'

      throw error
    } finally {
      this.options.toLaunchpad()
    }
  }

  loadTestingType (testingType: TestingType) {
    Promise.all([this.options.machineBrowsers(), this.loadCypressEnvFile()]).then(([browsers, envOptions]) => {
      if (this._projectInitialConfigManager?.ipc && this._cachedLoadConfig) {
        this._state = 'loadingNodeEvents'
        this._projectFinalConfigManager = new ProjectFinalConfigManager(this._projectInitialConfigManager.ipc, {
          configFile: this.options.configFile,
          configFilePath: this.configFilePath,
          envOptions,
          handlers: this.options.handlers,
          isRunMode: this.options.isRunMode,
          modeOptions: this.options.modeOptions,
          projectRoot: this.options.projectRoot,
          reloadConfig: this.reloadConfig,
          onError: this.options.onError,
          onWarning: this.options.onWarning,
          setupFullConfigWithDefaults: this.options.setupFullConfigWithDefaults,
          updateWithPluginValues: this.options.updateWithPluginValues,
        })

        return this._projectFinalConfigManager.loadFinalConfigForTestingType(this._cachedLoadConfig, testingType, browsers)
        .then((fullConfig) => {
          if (fullConfig) {
            this.options.onFinalConfigLoaded(fullConfig)
            this._state = 'ready'
          }
        })
      }

      return Promise.resolve()
    })
    .catch((error) => {
      this._state = 'errored'
      this.onLoadError(error)
    })
  }

  async reloadConfig () {
    this._projectInitialConfigManager = undefined
    this._projectFinalConfigManager = undefined

    await this.initializeConfig()
    if (this._testingType) {
      this.loadTestingType(this._testingType)
    }
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
    // TODO: this isn't i18n'd
    this.options.onError(error, 'Error Loading Config')
  }

  registerEvent (event: string, callback: Function) {
    return this._projectFinalConfigManager?.registerEvent(event, callback)
  }

  hasNodeEvent (eventName: string) {
    return this._projectFinalConfigManager?.hasNodeEvent(eventName)
  }

  executeNodeEvent (event: string, args: any[]) {
    return this._projectFinalConfigManager?.executeNodeEvent(event, args)
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

  destroy () {
    this._projectInitialConfigManager?.destroy()
    this._projectFinalConfigManager?.destroy()
    this._state = 'pending'
    this._cachedLoadConfig = undefined
    this._cachedFullConfig = undefined
  }
}
