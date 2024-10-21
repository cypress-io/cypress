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
import { EventCollectorSource, GitDataSource, LegacyCypressConfigJson } from '../sources'
import { OnFinalConfigLoadedOptions, ProjectConfigManager } from './ProjectConfigManager'
import pDefer from 'p-defer'
import { EventRegistrar } from './EventRegistrar'
import { getServerPluginHandlers, resetPluginHandlers } from '../util/pluginHandlers'
import { detectLanguage } from '@packages/scaffold-config'
import { validateNeedToRestartOnChange } from '@packages/config'
import { MAJOR_VERSION_FOR_CONTENT } from '@packages/types'
import { telemetry } from '@packages/telemetry'

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
  updateWithPluginValues(config: FullConfig, modifiedConfig: Partial<Cypress.ConfigOptions>, testingType: TestingType): FullConfig
  setupFullConfigWithDefaults(config: SetupFullConfigOptions): Promise<FullConfig>
}

export interface ProjectMetaState {
  isUsingTypeScript: boolean
  hasLegacyCypressJson: boolean
  hasCypressEnvFile: boolean
  hasValidConfigFile: boolean
  hasSpecifiedConfigViaCLI: false | string
  allFoundConfigFiles: string[]
  needsCypressJsonMigration: boolean
  isProjectUsingESModules: boolean
}

const PROJECT_META_STATE: ProjectMetaState = {
  isUsingTypeScript: false,
  hasLegacyCypressJson: false,
  allFoundConfigFiles: [],
  hasCypressEnvFile: false,
  hasSpecifiedConfigViaCLI: false,
  hasValidConfigFile: false,
  needsCypressJsonMigration: false,
  isProjectUsingESModules: false,
}

export class ProjectLifecycleManager {
  private _currentTestingType: TestingType | null = null
  private _runModeExitEarly: ((error: Error) => void) | undefined
  private _projectRoot: string | undefined
  private _configManager: ProjectConfigManager | undefined
  private _projectMetaState: ProjectMetaState = { ...PROJECT_META_STATE }
  private _pendingInitialize?: pDefer.DeferredPromise<FullConfig>
  private _cachedInitialConfig: Cypress.ConfigOptions | undefined
  private _cachedFullConfig: FullConfig | undefined
  private _initializedProject: unknown | undefined
  private _eventRegistrar: EventRegistrar

  constructor (private ctx: DataContext) {
    this._eventRegistrar = new EventRegistrar()

    if (ctx.coreData.currentProject) {
      this._setCurrentProject(ctx.coreData.currentProject)
    }

    return autoBindDebug(this)
  }

  get git () {
    return this.ctx.coreData.currentProjectGitInfo
  }

  async getProjectId (): Promise<string | null> {
    try {
      // No need to kick off config initialization if we need to migrate
      if (this.ctx.migration.needsCypressJsonMigration()) {
        return null
      }

      const contents = await this.ctx.project.getConfig()

      return contents.projectId ?? null
    } catch {
      return null
    }
  }

  get metaState () {
    return Object.freeze(this._projectMetaState)
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

  get isFullConfigReady () {
    return this._configManager?.isFullConfigReady
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
    return this.metaState.isUsingTypeScript ? 'ts' : 'js'
  }

  get eventProcessPid () {
    return this._configManager?.eventProcessPid
  }

  async clearCurrentProject () {
    await this.resetInternalState()
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
      onError: this.onLoadError,
      onInitialConfigLoaded: (initialConfig: Cypress.ConfigOptions) => {
        this._cachedInitialConfig = initialConfig

        this.ctx.emitter.toLaunchpad()
        this.ctx.emitter.toApp()
      },
      onFinalConfigLoaded: async (finalConfig: FullConfig, options: OnFinalConfigLoadedOptions) => {
        if (this._currentTestingType && finalConfig.specPattern) {
          await this.ctx.actions.project.setSpecsFoundBySpecPattern({
            projectRoot: this.projectRoot,
            testingType: this._currentTestingType,
            specPattern: this.ctx.modeOptions.spec || finalConfig.specPattern,
            configSpecPattern: finalConfig.specPattern,
            excludeSpecPattern: finalConfig.excludeSpecPattern,
            additionalIgnorePattern: finalConfig.additionalIgnorePattern,
          })
        }

        if (this._currentTestingType === 'component') {
          const span = telemetry.startSpan({ name: 'dataContext:ct:startDevServer' })

          /**
             * We need to start the dev server in the ProjectLifecycleManager when:
             *   1. GA component testing is running so we can compile the dev server will all specs matching the specPattern
             *   2. justInTimeCompile is enabled. In this case, we start a dev server
             *      with an empty specs list to initially compile the support file and related dependencies in order to hopefully
             *      leverage the dev server cache for recompiling for when we actually have a spec to add to the dev server entry.
             */
          const specsToStartDevServer = finalConfig.justInTimeCompile ? [] : this.ctx.project.specs
          const devServerOptions = await this.ctx._apis.projectApi.getDevServer().start({ specs: specsToStartDevServer, config: finalConfig })

          // If we received a cypressConfig.port we want to null it out
          // because we propagated it into the devServer.port and it is
          // later set as baseUrl which cypress is launched into
          //
          // The special case is cypress in cypress testing. If that's the case, we still need
          // the wrapper cypress to be running on 4455
          if (!process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF) {
            finalConfig.port = null
          } else {
            finalConfig.port = 4455
          }

          if (!devServerOptions?.port) {
            span?.end()
            throw getError('CONFIG_FILE_DEV_SERVER_INVALID_RETURN', devServerOptions)
          }

          finalConfig.baseUrl = `http://localhost:${devServerOptions?.port}`

          span?.end()
        }

        const pingBaseUrl = this._cachedFullConfig && this._cachedFullConfig.baseUrl !== finalConfig.baseUrl

        const restartOnChange = validateNeedToRestartOnChange(this._cachedFullConfig, finalConfig)

        this._cachedFullConfig = finalConfig

        // This happens automatically with openProjectCreate in run mode
        if (!this.ctx.isRunMode) {
          const shouldRelaunchBrowser = this.ctx.coreData.app.browserStatus !== 'closed'

          if (!this._initializedProject) {
            this._initializedProject = await this.ctx.actions.project.initializeActiveProject({})
          } else if (restartOnChange.server) {
            this.ctx.project.setRelaunchBrowser(shouldRelaunchBrowser)
            this._initializedProject = await this.ctx.actions.project.initializeActiveProject({})
          } else if ((restartOnChange.browser || options.shouldRestartBrowser) && shouldRelaunchBrowser) {
            this.ctx.project.setRelaunchBrowser(shouldRelaunchBrowser)
            await this.ctx.actions.browser.closeBrowser()
            await this.ctx.actions.browser.relaunchBrowser()
          }

          if (pingBaseUrl) {
            this.ctx.actions.project.pingBaseUrl().catch(this.onLoadError)
          }
        }

        await this.setInitialActiveBrowser()

        this._pendingInitialize?.resolve(finalConfig)
        this.ctx.emitter.configChange()
      },
      refreshLifecycle: async () => this.refreshLifecycle(),
    })
  }

  /**
   * Sets the initial `activeBrowser` depending on these criteria, in order of preference:
   *  1. The value of `--browser` passed via CLI.
   *  2. The last browser selected in `open` mode (by name and channel) for this project.
   *  3. The first browser found.
   */
  async setInitialActiveBrowser () {
    if (this.ctx.coreData.cliBrowser) {
      await this.setActiveBrowserByNameOrPath(this.ctx.coreData.cliBrowser)

      const preferences = await this.ctx._apis.localSettingsApi.getPreferences()

      const hasWelcomeBeenDismissed = Boolean(preferences.majorVersionWelcomeDismissed?.[MAJOR_VERSION_FOR_CONTENT])

      // only continue if the browser was successfully set - we must have an activeBrowser once this function resolves
      // but if the user needs to dismiss a landing page, don't continue, the active browser will be opened
      // by a mutation called from the client side when the user dismisses the welcome screen
      if (this.ctx.coreData.activeBrowser && hasWelcomeBeenDismissed) {
        // if `cypress open` was launched with a `--project` and `--testingType`, go ahead and launch the `--browser`
        if (this.ctx.modeOptions.project && this.ctx.modeOptions.testingType) {
          await this.ctx.actions.project.launchProject(this.ctx.coreData.currentTestingType)
        }

        return
      }
    }

    // lastBrowser is cached per-project.
    const prefs = await this.ctx.project.getProjectPreferences(path.basename(this.projectRoot))
    const browsers = await this.ctx.browser.allBrowsers()

    if (!browsers[0]) {
      this.ctx.onError(getError('UNEXPECTED_INTERNAL_ERROR', new Error('No browsers found, cannot set a browser')))

      return
    }

    const browser = (prefs?.lastBrowser && browsers.find((b) => {
      return b.name === prefs.lastBrowser!.name && b.channel === prefs.lastBrowser!.channel
    })) || browsers[0]

    this.ctx.actions.browser.setActiveBrowser(browser)
  }

  private async setActiveBrowserByNameOrPath (nameOrPath: string) {
    try {
      const browser = await this.ctx._apis.browserApi.ensureAndGetByNameOrPath(nameOrPath)

      this.ctx.debug('browser found to set', browser.name)

      this.ctx.actions.browser.setActiveBrowser(browser)
    } catch (e) {
      const error = e as CypressError

      this.ctx.onWarning(error)
    }
  }

  async refreshLifecycle (): Promise<void> {
    if (!this._projectRoot || !this._configManager || !this.readyToInitialize(this._projectRoot)) {
      return
    }

    // Make sure remote states in the server are reset when the project is reloaded.
    // TODO: maybe we should also reset the server state here as well?
    this.ctx._apis.projectApi.getRemoteStates()?.reset()

    this._configManager.resetLoadingState()

    // Emit here so that the user gets the impression that we're loading rather than waiting for a full refresh of the config for an update
    this.ctx.emitter.toLaunchpad()
    this.ctx.emitter.toApp()

    await this.initializeConfig()

    if (this._currentTestingType && this.isTestingTypeConfigured(this._currentTestingType)) {
      if (this._currentTestingType === 'component') {
        // Since we refresh the dev-server on config changes, we need to close it and clean up it's listeners
        // before we can start a new one. This needs to happen before we have registered the events of the child process
        this.ctx._apis.projectApi.getDevServer().close()
      }

      this._configManager.loadTestingType()
    } else {
      this.setAndLoadCurrentTestingType(null)
    }
  }

  async waitForInitializeSuccess (): Promise<boolean> {
    if (!this._configManager) {
      return false
    }

    if (this._configManager?.isLoadingConfigFile) {
      const span = telemetry.startSpan({ name: `dataContext:loadConfig` })

      try {
        await this.initializeConfig()

        return true
      } catch (error) {
        this.ctx.debug('error thrown by initializeConfig', error)

        return false
      } finally {
        span?.end()
      }
    }

    return !this._configManager?.isInError
  }

  async initializeConfig () {
    assert(this._configManager, 'Cannot initialize config without a config manager')

    return this._configManager.initializeConfig()
  }

  private _setCurrentProject (projectRoot: string) {
    process.chdir(projectRoot)

    this._projectRoot = projectRoot
    this._initializedProject = undefined

    this._configManager = this.createConfigManager()

    // Preemptively load these so that they are available when we need them later
    this.ctx.browser.machineBrowsers().catch(this.onLoadError)

    const packageManagerUsed = this.getPackageManagerUsed(projectRoot)

    this.ctx.update((s) => {
      s.currentProject = projectRoot
      s.currentProjectGitInfo?.destroy()
      s.currentProjectGitInfo = new GitDataSource({
        isRunMode: this.ctx.isRunMode,
        projectRoot,
        onError: this.ctx.onError,
        onBranchChange: () => {
          this.ctx.emitter.branchChange()
        },
        onGitInfoChange: (specPaths) => {
          this.ctx.emitter.gitInfoChange(specPaths)
        },
        onGitLogChange: async (shas) => {
          await this.ctx.relevantRuns.checkRelevantRuns(shas)
        },
      })

      s.eventCollectorSource?.destroy()
      if (this.ctx.isOpenMode) {
        s.eventCollectorSource = new EventCollectorSource(this.ctx)
      }

      s.diagnostics = { error: null, warnings: [] }
      s.packageManager = packageManagerUsed
    })

    this.verifyProjectRoot(projectRoot)

    if (this.readyToInitialize(this._projectRoot)) {
      this._configManager.initializeConfig().catch(this.onLoadError)
    }
  }

  /**
   * When we set the current project, we need to cleanup the
   * previous project that might have existed. We use this as the
   * single location we should use to set the `projectRoot`, because
   * we can call it from legacy code and it'll be a no-op if the `projectRoot`
   * is already the same, otherwise it'll do the necessary cleanup
   */
  async setCurrentProject (projectRoot: string) {
    if (this._projectRoot === projectRoot) {
      return
    }

    await this.resetInternalState()

    this._setCurrentProject(projectRoot)
  }

  /**
   * Handles pre-initialization checks. These will display warnings or throw with errors if catastrophic.
   * Returns false, if we're not ready to initialize due to needing to migrate
   *
   * @param projectRoot the project's root
   * @returns true if we can initialize and false if not
   */
  private readyToInitialize (projectRoot: string): boolean {
    const { needsCypressJsonMigration } = this.refreshMetaState()

    const legacyConfigPath = path.join(projectRoot, this.ctx.migration.legacyConfigFile)

    if (needsCypressJsonMigration && !this.ctx.isRunMode && this.ctx.fs.existsSync(legacyConfigPath)) {
      return false
    }

    this.legacyPluginGuard()

    this.configFileWarningCheck()

    return this.metaState.hasValidConfigFile
  }

  async legacyMigration () {
    try {
      const legacyConfigPath = path.join(this.projectRoot, this.ctx.migration.legacyConfigFile)
      // we run the legacy plugins/index.js in a child process
      // and mutate the config based on the return value for migration
      // only used in open mode (cannot migrate via terminal)
      const legacyConfig = await this.ctx.fs.readJson(legacyConfigPath) as LegacyCypressConfigJson

      // should never throw, unless there existing pluginsFile errors out,
      // in which case they are attempting to migrate an already broken project.
      await this.ctx.actions.migration.initialize(legacyConfig)
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
   * Sets, but doesn't load the current testing type. This is useful
   * for tests when we don't want to kick off node events
   */
  setCurrentTestingType (testingType: TestingType | null) {
    this.ctx.update((d) => {
      d.currentTestingType = testingType
      d.wizard.chosenBundler = null
      d.wizard.chosenFramework = null
      if (testingType) {
        d.diagnostics = {
          error: null,
          warnings: [],
        }
      }
    })

    this._currentTestingType = testingType

    assert(this._configManager, 'Cannot set a testing type without a config manager')
    this._configManager.setTestingType(testingType)
  }

  /**
   * Setting the testing type should automatically handle cleanup of existing
   * processes and load the config / initialize the plugin process associated
   * with the chosen testing type.
   */
  setAndLoadCurrentTestingType (testingType: TestingType | null) {
    this.ctx.update((d) => {
      d.currentTestingType = testingType
      d.wizard.chosenBundler = null
      d.wizard.chosenFramework = null
    })

    if (this._currentTestingType === testingType) {
      return
    }

    this._initializedProject = undefined
    this._currentTestingType = testingType

    assert(this._configManager, 'Cannot set a testing type without a config manager')
    this._configManager.setTestingType(testingType)

    if (!testingType) {
      return
    }

    if (this.ctx.isRunMode && this.loadedConfigFile && !this.isTestingTypeConfigured(testingType)) {
      return this.ctx.onError(getError('TESTING_TYPE_NOT_CONFIGURED', testingType))
    }

    if (this.ctx.isRunMode || (this.isTestingTypeConfigured(testingType) && !(this.ctx.coreData.forceReconfigureProject && this.ctx.coreData.forceReconfigureProject[testingType]))) {
      this._configManager.loadTestingType()
    }
  }

  private async resetInternalState () {
    if (this._configManager) {
      await this._configManager.destroy()
      this._configManager = undefined
    }

    await this.ctx.coreData.currentProjectGitInfo?.destroy()
    await this.ctx.project.destroy()
    await this.ctx.coreData.eventCollectorSource?.destroy()
    this._currentTestingType = null
    this._cachedInitialConfig = undefined
    this._cachedFullConfig = undefined
  }

  /**
   * Equivalent to the legacy "config.get()",
   * this sources the config from the various config sources
   */
  async getFullInitialConfig (options: Partial<AllModeOptions> = this.ctx.modeOptions, withBrowsers = true): Promise<FullConfig> {
    assert(this._configManager, 'Cannot get full config without a config manager')

    return this._configManager.getFullInitialConfig(options, withBrowsers)
  }

  async getConfigFileContents () {
    assert(this._configManager, 'Cannot get config file contents without a config manager')

    return this._configManager.getConfigFileContents()
  }

  async reinitializeCypress () {
    resetPluginHandlers()
    await this.resetInternalState()
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
      hasLegacyCypressJson: this.ctx.migration.legacyConfigFileExists(),
      hasCypressEnvFile: fs.existsSync(this._pathToFile('cypress.env.json')),
    }

    try {
      // TODO: convert to async FS method
      // eslint-disable-next-line no-restricted-syntax
      const pkgJson = this.ctx.fs.readJsonSync(this._pathToFile('package.json'))

      if (pkgJson.type === 'module') {
        metaState.isProjectUsingESModules = true
      }

      metaState.isUsingTypeScript = detectLanguage({
        projectRoot: this.projectRoot,
        customConfigFile: configFile,
        pkgJson,
        isMigrating: metaState.hasLegacyCypressJson,
      }) === 'ts'
    } catch {
      // No need to handle
    }

    if (configFile) {
      metaState.hasSpecifiedConfigViaCLI = this._pathToFile(configFile)
      if (configFile.endsWith('.json')) {
        metaState.needsCypressJsonMigration = true

        const configFileNameAfterMigration = configFile.replace('.json', `.config.${metaState.isUsingTypeScript ? 'ts' : 'js'}`)

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
      this.setConfigFilePath(`cypress.config.${metaState.isUsingTypeScript ? 'ts' : 'js'}`)
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
      // TODO: convert to async fs call
      // eslint-disable-next-line no-restricted-syntax
      if (!fs.statSync(root).isDirectory()) {
        throw new Error('NOT DIRECTORY')
      }
    } catch (err) {
      throw getError('NO_PROJECT_FOUND_AT_PROJECT_ROOT', this.projectRoot)
    }
  }

  async destroy () {
    await this.resetInternalState()
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

  async initializeOpenMode (testingType: TestingType | null) {
    if (this._projectRoot && testingType && await this.waitForInitializeSuccess()) {
      this.setAndLoadCurrentTestingType(testingType)

      await this.initializeProjectSetup(testingType)
    }
  }

  /**
   * Prepare the setup process for a project if one exists, otherwise complete setup
   *
   * @param testingType
   * @returns
   */
  async initializeProjectSetup (testingType: TestingType) {
    if (this.isTestingTypeConfigured(testingType)) {
      return
    }

    if (testingType === 'e2e' && !this.ctx.migration.needsCypressJsonMigration()) {
      // E2E doesn't have a wizard, so if we have a testing type on load we just create/update their cypress.config.js.
      await this.ctx.actions.wizard.scaffoldTestingType()
    } else if (testingType === 'component') {
      await this.ctx.actions.wizard.detectFrameworks()
      await this.ctx.actions.wizard.initialize()
    }
  }

  async initializeRunMode (testingType: TestingType | null) {
    this._pendingInitialize = pDefer()

    if (await this.waitForInitializeSuccess()) {
      if (!this.metaState.hasValidConfigFile) {
        return this.ctx.onError(getError('NO_DEFAULT_CONFIG_FILE_FOUND', this.projectRoot))
      }

      const span = telemetry.startSpan({ name: 'dataContext:setAndLoadCurrentTestingType' })

      span?.setAttributes({ testingType: testingType ? testingType : 'undefined' })

      if (testingType) {
        this.setAndLoadCurrentTestingType(testingType)
      } else {
        this.setAndLoadCurrentTestingType('e2e')
      }
    }

    return this._pendingInitialize.promise.finally(() => {
      telemetry.getSpan('dataContext:setAndLoadCurrentTestingType')?.end()
      this._pendingInitialize = undefined
    })
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
  onLoadError = (err: CypressError) => {
    if (this.ctx.isRunMode && this._pendingInitialize) {
      this._pendingInitialize.reject(err)
    } else {
      this.ctx.onError(err, 'Cypress configuration error')
    }
  }

  mainProcessWillDisconnect (): Promise<void> {
    if (!this._configManager) {
      return Promise.resolve()
    }

    return this._configManager.mainProcessWillDisconnect()
  }
}
