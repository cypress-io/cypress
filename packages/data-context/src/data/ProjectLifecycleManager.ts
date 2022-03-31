/**
 * The "Project Lifecycle" is the centralized manager for the project,
 * config, browser, and the number of possible states that can occur based
 * on inputs that change these behaviors.
 *
 * See `guides/app-lifecycle.md` for documentation on the project & possible
 * states that exist, and how they are managed.
 */
import path from 'path'
import _ from 'lodash'
import resolve from 'resolve'
import fs from 'fs'

import { getError, CypressError, ConfigValidationFailureInfo } from '@packages/errors'
import type { DataContext } from '..'
import assert from 'assert'
import type { AllModeOptions, FoundBrowser, FullConfig, TestingType } from '@packages/types'
import { autoBindDebug } from '../util/autoBindDebug'
import type { LegacyCypressConfigJson } from '../sources'
import { ProjectConfigManager } from './ProjectConfigManager'
import { EventRegistrar } from './EventRegistrar'
import { getServerPluginHandlers, resetPluginHandlers } from '../util/pluginHandlers'

export interface SetupFullConfigOptions {
  projectName: string
  projectRoot: string
  cliConfig: Partial<Cypress.ConfigOptions>
  config: Partial<Cypress.ConfigOptions>
  envFile: Partial<Cypress.ConfigOptions>
  options: Partial<AllModeOptions>
}

const POTENTIAL_CONFIG_FILES = [
  'cypress.config.ts',
  'cypress.config.mjs',
  'cypress.config.cjs',
  'cypress.config.js',
]

/**
 * All of the APIs injected from @packages/server & @packages/config
 * since these are not strictly typed
 */
export interface InjectedConfigApi {
  cypressVersion: string
  validateConfig<T extends Cypress.ConfigOptions>(config: Partial<T>, onErr: (errMsg: ConfigValidationFailureInfo | string) => never): T
  allowedConfig(config: Cypress.ConfigOptions): Cypress.ConfigOptions
  updateWithPluginValues(config: FullConfig, modifiedConfig: Partial<Cypress.ConfigOptions>): FullConfig
  setupFullConfigWithDefaults(config: SetupFullConfigOptions): Promise<FullConfig>
}

export interface ProjectMetaState {
  hasFrontendFramework: 'nuxt' | 'react' | 'react-scripts' | 'vue' | 'next' | false
  hasTypescript: boolean
  hasLegacyCypressJson: boolean
  hasCypressEnvFile: boolean
  hasValidConfigFile: boolean
  hasSpecifiedConfigViaCLI: false | string
  allFoundConfigFiles: string[]
  needsCypressJsonMigration: boolean
}

const PROJECT_META_STATE: ProjectMetaState = {
  hasFrontendFramework: false,
  hasTypescript: false,
  hasLegacyCypressJson: false,
  allFoundConfigFiles: [],
  hasCypressEnvFile: false,
  hasSpecifiedConfigViaCLI: false,
  hasValidConfigFile: false,
  needsCypressJsonMigration: false,
}

export class ProjectLifecycleManager {
  private _currentTestingType: TestingType | null = null
  private _runModeExitEarly: ((error: Error) => void) | undefined
  private _projectRoot: string | undefined
  private _configManager: ProjectConfigManager | undefined
  private _projectMetaState: ProjectMetaState = { ...PROJECT_META_STATE }
  private _cachedInitialConfig: Cypress.ConfigOptions | undefined
  private _cachedFullConfig: FullConfig | undefined
  private _initializedProject: unknown | undefined
  private _eventRegistrar: EventRegistrar

  constructor (private ctx: DataContext) {
    this._eventRegistrar = new EventRegistrar()
    if (ctx.coreData.currentProject) {
      this.setCurrentProject(ctx.coreData.currentProject)
    }

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

  get metaState () {
    return Object.freeze(this._projectMetaState)
  }

  get legacyJsonPath () {
    return path.join(this.configFilePath, this.legacyConfigFile)
  }

  get legacyConfigFile () {
    if (this.ctx.modeOptions.configFile && this.ctx.modeOptions.configFile.endsWith('.json')) {
      return this.ctx.modeOptions.configFile
    }

    return 'cypress.json'
  }

  get configFile () {
    return this.ctx.modeOptions.configFile ?? (this._configManager?.configFilePath && path.basename(this._configManager.configFilePath)) ?? 'cypress.config.js'
  }

  get configFilePath () {
    assert(this._configManager, 'Cannot retrieve config file path without a config manager')

    return this._configManager.configFilePath
  }

  setConfigFilePath (fileName: string) {
    assert(this._configManager, 'Cannot set config file path without a config manager')
    this._configManager.configFilePath = this._pathToFile(fileName)
  }

  get envFilePath () {
    return path.join(this.projectRoot, 'cypress.env.json')
  }

  get browsers () {
    if (this.loadedFullConfig) {
      return this.loadedFullConfig.browsers as FoundBrowser[]
    }

    return null
  }

  get isLoadingConfigFile () {
    return this._configManager?.isLoadingConfigFile
  }

  get isLoadingNodeEvents () {
    return this._configManager?.isLoadingNodeEvents
  }

  get isReady () {
    return this._configManager?.isReady
  }

  get loadedConfigFile (): Partial<Cypress.ConfigOptions> | null {
    return this._cachedInitialConfig ?? null
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

  get fileExtensionToUse () {
    return this.metaState.hasTypescript ? 'ts' : 'js'
  }

  async checkIfLegacyConfigFileExist () {
    const legacyConfigFileExist = await this.ctx.deref.actions.file.checkIfFileExists(this.legacyConfigFile)

    return Boolean(legacyConfigFileExist)
  }

  clearCurrentProject () {
    this.resetInternalState()
    this._initializedProject = undefined
    this._projectRoot = undefined
  }

  private getPackageManagerUsed (projectRoot: string) {
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

  private createConfigManager () {
    return new ProjectConfigManager({
      ctx: this.ctx,
      configFile: this.configFile,
      projectRoot: this.projectRoot,
      handlers: getServerPluginHandlers(),
      hasCypressEnvFile: this._projectMetaState.hasCypressEnvFile,
      eventRegistrar: this._eventRegistrar,
      onError: (cypressError, title) => {
        if (this.ctx.isRunMode) {
          throw cypressError
        } else {
          this.ctx.onError(cypressError, title)
        }
      },
      onInitialConfigLoaded: (initialConfig: Cypress.ConfigOptions) => {
        this._cachedInitialConfig = initialConfig

        if (this.ctx.coreData.scaffoldedFiles) {
          this.ctx.coreData.scaffoldedFiles.filter((f) => {
            if (f.file.absolute === this.configFilePath && f.status !== 'valid') {
              f.status = 'valid'
            }
          })
        }

        this.ctx.emitter.toLaunchpad()
      },
      onFinalConfigLoaded: async (finalConfig: FullConfig) => {
        this._cachedFullConfig = finalConfig

        // This happens automatically with openProjectCreate in run mode
        if (!this.ctx.isRunMode) {
          if (!this._initializedProject) {
            this._initializedProject = await this.ctx.actions.project.initializeActiveProject({})
          }
        }

        if (this.ctx.coreData.cliBrowser) {
          await this.setActiveBrowser(this.ctx.coreData.cliBrowser)
        }

        if (this._currentTestingType && finalConfig.specPattern) {
          await this.ctx.actions.project.setSpecsFoundBySpecPattern({
            path: this.projectRoot,
            testingType: this._currentTestingType,
            specPattern: this.ctx.modeOptions.spec || finalConfig.specPattern,
            excludeSpecPattern: finalConfig.excludeSpecPattern,
            additionalIgnorePattern: finalConfig.additionalIgnorePattern,
          })
        }
      },
      refreshLifecycle: async () => this.refreshLifecycle(),
    })
  }

  async refreshLifecycle (): Promise<FullConfig | null> {
    assert(this._projectRoot, 'Cannot reload config without a project root')
    assert(this._configManager, 'Cannot reload config without a config manager')

    try {
      this._configManager.resetLoadingState()
      const config = await this.initializeConfig()

      if (config && this._currentTestingType && this.isTestingTypeConfigured(this._currentTestingType)) {
        return await this._configManager.loadTestingType()
      }

      return await this.setCurrentTestingType(null)
    } catch (error) {
      this.onLoadError(error)

      return null
    }
  }

  async initializeConfig (): Promise<Partial<Cypress.UserConfigOptions<any>> | null> {
    try {
      assert(this._projectRoot, 'Cannot initialize config without a project root')
      if (await this.readyToInitialize(this._projectRoot)) {
        assert(this._configManager, 'Cannot initialize config without a config manager')

        return await this._configManager.initializeConfig()
      }
    } catch (error) {
      this.onLoadError(error)
    }

    return null
  }

  private async setActiveBrowser (cliBrowser: string) {
    // When we're starting up, if we've chosen a browser to run with, check if it exists
    this.ctx.coreData.cliBrowser = null

    try {
      const browser = await this.ctx._apis.browserApi.ensureAndGetByNameOrPath(cliBrowser)

      this.ctx.coreData.chosenBrowser = browser ?? null
    } catch (e) {
      const error = e as CypressError

      this.ctx.onWarning(error)
    }
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

    this.resetInternalState()

    this._configManager = this.createConfigManager()

    // Preemptively load these so that they are available when we need them later
    this.ctx.browser.machineBrowsers().catch(this.onLoadError)

    const packageManagerUsed = this.getPackageManagerUsed(projectRoot)

    this.ctx.update((s) => {
      s.currentProject = projectRoot
      s.packageManager = packageManagerUsed
    })
  }

  /**
   * Handles pre-initialization checks. These will display warnings or throw with errors if catastrophic.
   * Returns yes, if we're not ready to initialize due to needing to migrate
   *
   * @param projectRoot the project's root
   * @returns true if we can initialize and false if not
   */
  private async readyToInitialize (projectRoot: string): Promise<boolean> {
    this.verifyProjectRoot(projectRoot)

    const { needsCypressJsonMigration } = this.refreshMetaState()

    const legacyConfigPath = path.join(projectRoot, this.legacyConfigFile)

    if (needsCypressJsonMigration && !this.ctx.isRunMode && this.ctx.fs.existsSync(legacyConfigPath)) {
      await this.legacyMigration(legacyConfigPath)

      return false
    }

    this.legacyPluginGuard()

    this.configFileWarningCheck()

    return this.metaState.hasValidConfigFile
  }

  async legacyMigration (legacyConfigPath: string) {
    try {
      // we run the legacy plugins/index.js in a child process
      // and mutate the config based on the return value for migration
      // only used in open mode (cannot migrate via terminal)
      const legacyConfig = this.ctx.fs.readJsonSync(legacyConfigPath) as LegacyCypressConfigJson

      // should never throw, unless there existing pluginsFile errors out,
      // in which case they are attempting to migrate an already broken project.
      await this.ctx.actions.migration.initialize(legacyConfig)

      this.ctx.emitter.toLaunchpad()
    } catch (error) {
      this.onLoadError(error)
    }
  }

  get runModeExitEarly () {
    return this._runModeExitEarly
  }

  set runModeExitEarly (val: ((err: Error) => void) | undefined) {
    this._runModeExitEarly = val
  }

  /**
   * Setting the testing type should automatically handle cleanup of existing
   * processes and load the config / initialize the plugin process associated
   * with the chosen testing type.
   */
  async setCurrentTestingType (testingType: TestingType | null): Promise<FullConfig | null> {
    try {
      this.ctx.update((d) => {
        d.currentTestingType = testingType
        d.wizard.chosenBundler = null
        d.wizard.chosenFramework = null
      })

      if (this._currentTestingType === testingType) {
        return null
      }

      this._initializedProject = undefined
      this._currentTestingType = testingType

      assert(this._configManager, 'Cannot set a testing type without a config manager')
      this._configManager.setTestingType(testingType)

      if (!testingType) {
        return null
      }

      if (this.ctx.isRunMode || (this.isTestingTypeConfigured(testingType) && !(this.ctx.coreData.forceReconfigureProject && this.ctx.coreData.forceReconfigureProject[testingType]))) {
        return await this._configManager.loadTestingType()
      }

      return null
    } catch (error) {
      this.onLoadError(error)

      return null
    }
  }

  scaffoldFilesIfNecessary () {
    if (this._currentTestingType && this._projectMetaState.hasValidConfigFile && !this.isTestingTypeConfigured(this._currentTestingType) && !this.ctx.isRunMode) {
      this.ctx.actions.wizard.scaffoldTestingType().catch(this.onLoadError)
    }
  }

  private resetInternalState () {
    if (this._configManager) {
      this._configManager.destroy()
      this._configManager = undefined
    }

    this.ctx.project.destroy()
    this._currentTestingType = null
    this._cachedInitialConfig = undefined
    this._cachedFullConfig = undefined
  }

  /**
   * Equivalent to the legacy "config.get()",
   * this sources the config from the various config sources
   */
  async getFullInitialConfig (options: Partial<AllModeOptions> = this.ctx.modeOptions, withBrowsers = true): Promise<FullConfig> {
    assert(this._configManager, 'Cannot get full config a config manager')

    return await this._configManager.getFullInitialConfig(options, withBrowsers)
  }

  async getConfigFileContents () {
    assert(this._configManager, 'Cannot get config file contents without a config manager')

    return await this._configManager.getConfigFileContents()
  }

  async loadCypressEnvFile () {
    assert(this._configManager, 'Cannot load a cypress env file without a config manager')

    return await this._configManager.loadCypressEnvFile()
  }

  reinitializeCypress () {
    resetPluginHandlers()
    this.resetInternalState()
  }

  registerEvent (event: string, callback: Function) {
    return this._eventRegistrar.registerEvent(event, callback)
  }

  hasNodeEvent (eventName: string) {
    return this._eventRegistrar.hasNodeEvent(eventName)
  }

  executeNodeEvent (event: string, args: any[]) {
    return this._eventRegistrar.executeNodeEvent(event, args)
  }

  private legacyPluginGuard () {
    // test and warn for incompatible plugin
    try {
      const retriesPluginPath = path.dirname(resolve.sync('cypress-plugin-retries/package.json', {
        basedir: this.projectRoot,
      }))

      this.ctx.onWarning(getError('INCOMPATIBLE_PLUGIN_RETRIES', path.relative(this.projectRoot, retriesPluginPath)))
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
      hasLegacyCypressJson: fs.existsSync(this._pathToFile(this.legacyConfigFile)),
      hasCypressEnvFile: fs.existsSync(this._pathToFile('cypress.env.json')),
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

    if (configFile) {
      metaState.hasSpecifiedConfigViaCLI = this._pathToFile(configFile)
      if (configFile.endsWith('.json')) {
        metaState.needsCypressJsonMigration = true

        const configFileNameAfterMigration = configFile.replace('.json', `.config.${metaState.hasTypescript ? 'ts' : 'js'}`)

        if (this.ctx.fs.existsSync(this._pathToFile(configFileNameAfterMigration))) {
          if (this.ctx.fs.existsSync(this._pathToFile(configFile))) {
            this.ctx.onError(getError('LEGACY_CONFIG_FILE', configFileNameAfterMigration, this.projectRoot, configFile))
          } else {
            this.ctx.onError(getError('MIGRATION_ALREADY_OCURRED', configFileNameAfterMigration, configFile))
          }
        }
      } else {
        this.setConfigFilePath(configFile)
        if (fs.existsSync(this.configFilePath)) {
          metaState.hasValidConfigFile = true
        }
      }

      this._projectMetaState = metaState

      return metaState
    }

    let configFilePathSet = false

    metaState.allFoundConfigFiles = []

    for (const fileName of POTENTIAL_CONFIG_FILES) {
      const filePath = this._pathToFile(fileName)
      const fileExists = fs.existsSync(filePath)

      if (fileExists) {
        // We'll collect all the found config files.
        // If we found more than one, this list will be used in an error message.
        metaState.allFoundConfigFiles.push(fileName)

        // We've found our first config file! We'll continue looping to make sure there's
        // only one. Looping over all config files is done so we can provide rich errors and warnings.
        if (!configFilePathSet) {
          metaState.hasValidConfigFile = true
          this.setConfigFilePath(fileName)
          configFilePathSet = true
        }
      }
    }

    // We finished looping through all of the possible config files
    // And we *still* didn't find anything. Set the configFilePath to JS or TS.
    if (!configFilePathSet) {
      this.setConfigFilePath(`cypress.config.${metaState.hasTypescript ? 'ts' : 'js'}`)
      configFilePathSet = true
    }

    if (metaState.hasLegacyCypressJson && !metaState.hasValidConfigFile) {
      metaState.needsCypressJsonMigration = true
    }

    this._projectMetaState = metaState

    return metaState
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
      throw getError('NO_PROJECT_FOUND_AT_PROJECT_ROOT', this.projectRoot)
    }
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

  async needsCypressJsonMigration () {
    const legacyConfigFileExist = await this.checkIfLegacyConfigFileExist()

    return this.metaState.needsCypressJsonMigration && Boolean(legacyConfigFileExist)
  }

  async initializeRunMode (testingType: TestingType | null): Promise<FullConfig | null> {
    if (!this.metaState.hasValidConfigFile) {
      this.ctx.onError(getError('NO_DEFAULT_CONFIG_FILE_FOUND', this.projectRoot))

      return null
    }

    if (testingType) {
      return await this.setCurrentTestingType(testingType)
    }

    return await this.setCurrentTestingType('e2e')
  }

  private configFileWarningCheck () {
    // Only if they've explicitly specified a config file path do we error, otherwise they'll go through onboarding
    if (!this.metaState.hasValidConfigFile && this.metaState.hasSpecifiedConfigViaCLI !== false && this.ctx.isRunMode) {
      this.onLoadError(getError('CONFIG_FILE_NOT_FOUND', path.basename(this.metaState.hasSpecifiedConfigViaCLI), path.dirname(this.metaState.hasSpecifiedConfigViaCLI)))
    }

    if (this.metaState.hasLegacyCypressJson && !this.metaState.hasValidConfigFile && this.ctx.isRunMode) {
      this.onLoadError(getError('CONFIG_FILE_MIGRATION_NEEDED', this.projectRoot))
    }

    if (this.metaState.allFoundConfigFiles.length > 1) {
      this.onLoadError(getError('CONFIG_FILES_LANGUAGE_CONFLICT', this.projectRoot, this.metaState.allFoundConfigFiles))
    }

    if (this.metaState.hasValidConfigFile && this.metaState.hasLegacyCypressJson) {
      this.onLoadError(getError('LEGACY_CONFIG_FILE', path.basename(this.configFilePath), this.projectRoot))
    }
  }

  /**
   * When there is an error during any part of the lifecycle
   * initiation, we pass it through here. This allows us to intercept
   * centrally in the e2e tests, as well as notify the "pending initialization"
   * for run mode
   */
  private onLoadError = (err: any) => {
    if (this.ctx.isRunMode && this._configManager) {
      this._configManager.onLoadError(err)
    } else {
      this.ctx.onError(err, 'Error Loading Config')
    }
  }
}
