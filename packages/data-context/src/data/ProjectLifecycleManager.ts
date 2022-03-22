/**
 * The "Project Lifecycle" is the centralized manager for the project,
 * config, browser, and the number of possible states that can occur based
 * on inputs that change these behaviors.
 *
 * See `guides/app-lifecycle.md` for documentation on the project & possible
 * states that exist, and how they are managed.
 */
import chokidar, { FSWatcher } from 'chokidar'
import path from 'path'
import _ from 'lodash'
import resolve from 'resolve'
import debugLib from 'debug'
import pDefer from 'p-defer'
import fs from 'fs'

import { getError, CypressError, ConfigValidationFailureInfo } from '@packages/errors'
import type { DataContext } from '..'
import assert from 'assert'
import type { AllModeOptions, FoundBrowser, FullConfig, TestingType } from '@packages/types'
import type { BreakingErrResult, BreakingOptionErrorKey } from '@packages/config'
import { autoBindDebug } from '../util/autoBindDebug'
import type { LegacyCypressConfigJson } from '../sources'
import { ProjectConfigManager } from './ProjectConfigManager'
import type { IpcHandler } from './ProjectConfigIpc'

const debug = debugLib(`cypress:lifecycle:ProjectLifecycleManager`)

const potentialConfigFiles = [
  'cypress.config.ts',
  'cypress.config.mjs',
  'cypress.config.cjs',
  'cypress.config.js',
]

export interface SetupFullConfigOptions {
  projectName: string
  projectRoot: string
  cliConfig: Partial<Cypress.ConfigOptions>
  config: Partial<Cypress.ConfigOptions>
  envFile: Partial<Cypress.ConfigOptions>
  options: Partial<AllModeOptions>
}

type BreakingValidationFn<T> = (type: BreakingOptionErrorKey, val: BreakingErrResult) => T

/**
 * All of the APIs injected from @packages/server & @packages/config
 * since these are not strictly typed
 */
export interface InjectedConfigApi {
  cypressVersion: string
  getServerPluginHandlers: () => IpcHandler[]
  validateConfig<T extends Cypress.ConfigOptions>(config: Partial<T>, onErr: (errMsg: ConfigValidationFailureInfo | string) => never): T
  allowedConfig(config: Cypress.ConfigOptions): Cypress.ConfigOptions
  updateWithPluginValues(config: FullConfig, modifiedConfig: Partial<Cypress.ConfigOptions>): FullConfig
  setupFullConfigWithDefaults(config: SetupFullConfigOptions): Promise<FullConfig>
  validateRootConfigBreakingChanges<T extends Cypress.ConfigOptions>(config: Partial<T>, onWarning: BreakingValidationFn<CypressError>, onErr: BreakingValidationFn<never>): void
  validateLaunchpadConfigBreakingChanges<T extends Cypress.ConfigOptions>(config: Partial<T>, onWarning: BreakingValidationFn<CypressError>, onErr: BreakingValidationFn<never>): void
  validateTestingTypeConfigBreakingChanges<T extends Cypress.ConfigOptions>(config: Partial<T>, testingType: Cypress.TestingType, onWarning: BreakingValidationFn<CypressError>, onErr: BreakingValidationFn<never>): void
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
  // Config, from the cypress.config.{js|ts}
  private watchers = new Set<chokidar.FSWatcher>()
  private _currentTestingType: TestingType | null = null
  private _runModeExitEarly: ((error: Error) => void) | undefined
  private _projectRoot: string | undefined
  private _configFilePath: string | undefined
  private _configManager: ProjectConfigManager | undefined
  private _projectMetaState: ProjectMetaState = { ...PROJECT_META_STATE }
  _pendingMigrationInitialize?: pDefer.DeferredPromise<void>

  constructor (private ctx: DataContext) {
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
    return this.ctx.modeOptions.configFile ?? path.basename(this.configFilePath) ?? 'cypress.config.js'
  }

  get configFilePath () {
    assert(this._configFilePath, 'Expected configFilePath to be found')

    return this._configFilePath
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

  get isLoadedNodeEvents () {
    return this._configManager?.isLoadedNodeEvents
  }

  get loadedConfigFile (): Partial<Cypress.ConfigOptions> | null {
    return this._configManager ? this._configManager.loadedConfigFile : null
  }

  get loadedFullConfig (): FullConfig | null {
    return this._configManager ? this._configManager.loadedFullConfig : null
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

  #createConfigManager () {
    return new ProjectConfigManager({
      configFilePath: this.configFilePath,
      configFile: this.configFile,
      projectRoot: this.projectRoot,
      nodePath: this.ctx.nodePath,
      modeOptions: this.ctx.modeOptions,
      isRunMode: this.ctx.isRunMode,
      handlers: this.ctx._apis.configApi.getServerPluginHandlers(),
      cypressVersion: this.ctx._apis.configApi.cypressVersion,
      hasCypressEnvFile: this._projectMetaState.hasCypressEnvFile,
      onError: (cypressError, title) => {
        this.ctx.onError(cypressError, title)
      },
      onWarning: (error) => {
        this.ctx.onWarning(error)
      },
      toLaunchpad: (...args) => {
        this.ctx.emitter.toLaunchpad(...args)
      },
      onConfigLoaded: () => {
        assert(this._currentTestingType)
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
      },
      setActiveBrowser: async () => {
        if (this.ctx.coreData.cliBrowser) {
          await this.setActiveBrowser(this.ctx.coreData.cliBrowser)
        }
      },
      updateWithPluginValues: (config, modifiedConfig) => {
        return this.ctx._apis.configApi.updateWithPluginValues(config, modifiedConfig)
      },
      initializeActiveProject: async (options) => {
        return this.ctx.actions.project.initializeActiveProject(options)
      },
      machineBrowsers: async () => {
        return this.ctx.browser.machineBrowsers()
      },
      setupFullConfigWithDefaults: async (config) => {
        return this.ctx._apis.configApi.setupFullConfigWithDefaults(config)
      },
    })
  }

  async reloadConfig () {
    assert(this._configManager)

    return this._configManager.reloadConfig
  }

  async initializeConfig () {
    assert(this._configManager)

    return this._configManager.initializeConfig()
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
    this._pendingMigrationInitialize = pDefer()
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

    const legacyConfigPatah = path.join(projectRoot, this.legacyConfigFile)

    if (needsCypressJsonMigration && !this.ctx.isRunMode && this.ctx.fs.existsSync(legacyConfigPatah)) {
      // we run the legacy plugins/index.js in a child process
      // and mutate the config based on the return value for migration
      // only used in open mode (cannot migrate via terminal)
      const legacyConfig = this.ctx.fs.readJsonSync(legacyConfigPatah) as LegacyCypressConfigJson

      // should never throw, unless there existing pluginsFile errors out,
      // in which case they are attempting to migrate an already broken project.
      this.ctx.actions.migration.initialize(legacyConfig)
      .then(this._pendingMigrationInitialize?.resolve)
      .finally(() => this._pendingMigrationInitialize = undefined)
      .catch(this.onLoadError)
    }

    this.configFileWarningCheck()
    this._configManager = this.#createConfigManager()

    if (this.metaState.hasValidConfigFile) {
      // at this point, there is not a cypress configuration file to initialize
      // the project will be scaffolded and when the user selects the testing type
      // the would like to setup
      this._configManager.initializeConfig().catch(this.onLoadError)
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
      d.wizard.chosenBundler = null
      d.wizard.chosenFramework = null
    })

    if (this._currentTestingType === testingType) {
      return
    }

    this._currentTestingType = testingType

    if (!testingType) {
      return
    }

    assert(this._configManager)
    this._configManager.setTestingType(testingType)
    if (this.isTestingTypeConfigured(testingType) && !(this.ctx.coreData.forceReconfigureProject && this.ctx.coreData.forceReconfigureProject[testingType])) {
      this._configManager.loadTestingType()
    }
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
    if (this._configManager) {
      this._configManager.destroy()
      this._configManager = undefined
    }

    this.closeWatchers()
    this._currentTestingType = null
  }

  /**
   * Equivalent to the legacy "config.get()",
   * this sources the config from the various config sources
   */
  async getFullInitialConfig (options: Partial<AllModeOptions> = this.ctx.modeOptions, withBrowsers = true): Promise<FullConfig> {
    assert(this._configManager)

    return this._configManager.getFullInitialConfig(options, withBrowsers)
  }

  async getConfigFileContents () {
    assert(this._configManager)

    return this._configManager.getConfigFileContents()
  }

  /**
   * Initializes the "watchers" for the current
   * config for "open" mode.
   */
  initializeConfigWatchers () {
    if (this.ctx.isRunMode) {
      return
    }

    const legacyFileWatcher = this.addWatcher([
      this._pathToFile(this.legacyConfigFile),
      ...potentialConfigFiles.map((f) => this._pathToFile(f)),
    ])

    legacyFileWatcher.on('all', (event, file) => {
      debug('WATCHER: config file event', event, file)
      let shouldReloadConfig = this.configFile === file

      if (!shouldReloadConfig) {
        const metaState = this._projectMetaState
        const nextMetaState = this.refreshMetaState()

        shouldReloadConfig = !_.isEqual(metaState, nextMetaState)
      }

      if (shouldReloadConfig) {
        this.ctx.update((coreData) => {
          coreData.baseError = null
        })

        assert(this._configManager)
        this._configManager.reloadConfig().catch(this.onLoadError)
      }
    })

    legacyFileWatcher.on('error', (err) => {
      debug('error watching config files %O', err)
      this.ctx.onWarning(getError('UNEXPECTED_INTERNAL_ERROR', err))
    })

    const cypressEnvFileWatcher = this.addWatcher(this.envFilePath)

    cypressEnvFileWatcher.on('all', () => {
      this.ctx.update((coreData) => {
        coreData.baseError = null
      })

      assert(this._configManager)
      this._configManager.reloadCypressEnvFile().catch(this.onLoadError)
    })
  }

  loadCypressEnvFile () {
    assert(this._configManager)

    return this._configManager.loadCypressEnvFile()
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

  reinitializeCypress () {
    this.resetInternalState()
  }

  hasNodeEvent (eventName: string) {
    return this._configManager?.hasNodeEvent(eventName)
  }

  executeNodeEvent (event: string, args: any[]) {
    // TODO: Evaluate everywhere we optionally chain config manager
    assert(this._configManager)

    return this._configManager?.executeNodeEvent(event, args)
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

        const configFileNameAfterMigration = configFile.replace('.json', `.config.${metaState.hasTypescript ? 'ts' : 'js'}`)

        if (this.ctx.fs.existsSync(this._pathToFile(configFileNameAfterMigration))) {
          if (this.ctx.fs.existsSync(this._pathToFile(configFile))) {
            this.ctx.onError(getError('LEGACY_CONFIG_FILE', configFileNameAfterMigration, this.projectRoot, configFile))
          } else {
            this.ctx.onError(getError('MIGRATION_ALREADY_OCURRED', configFileNameAfterMigration, configFile))
          }
        }
      } else {
        this._configFilePath = this._pathToFile(configFile)
        if (fs.existsSync(this._configFilePath)) {
          metaState.hasValidConfigFile = true
        }
      }

      this._projectMetaState = metaState

      return metaState
    }

    metaState.allFoundConfigFiles = []

    for (const fileName of potentialConfigFiles) {
      const filePath = this._pathToFile(fileName)
      const fileExists = fs.existsSync(filePath)

      if (fileExists) {
        // We'll collect all the found config files.
        // If we found more than one, this list will be used in an error message.
        metaState.allFoundConfigFiles.push(fileName)

        // We've found our first config file! We'll continue looping to make sure there's
        // only one. Looping over all config files is done so we can provide rich errors and warnings.
        if (!this._configFilePath) {
          metaState.hasValidConfigFile = true
          this.setConfigFilePath(fileName)
        }
      }
    }

    // We finished looping through all of the possible config files
    // And we *still* didn't find anything. Set the configFilePath to JS or TS.
    if (!this._configFilePath) {
      this.setConfigFilePath(`cypress.config.${metaState.hasTypescript ? 'ts' : 'js'}`)
    }

    if (metaState.hasLegacyCypressJson && !metaState.hasValidConfigFile) {
      metaState.needsCypressJsonMigration = true
    }

    this._projectMetaState = metaState

    return metaState
  }

  setConfigFilePath (fileName: string) {
    this._configFilePath = this._pathToFile(fileName)
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

  private _pendingInitialize?: pDefer.DeferredPromise<FullConfig>

  async initializeRunMode () {
    this._pendingInitialize = pDefer()

    if (!this._currentTestingType) {
      // e2e is assumed to be the default testing type if
      // none is passed in run mode
      this.setCurrentTestingType('e2e')
    }

    if (!this.metaState.hasValidConfigFile) {
      return this.ctx.onError(getError('NO_DEFAULT_CONFIG_FILE_FOUND', this.projectRoot))
    }

    return this._pendingInitialize.promise.finally(() => {
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
  private onLoadError = (err: any) => {
    if (this.ctx.isRunMode && this._pendingInitialize) {
      this._pendingInitialize.reject(err)
    } else {
      this.ctx.onError(err, 'Error Loading Config')
    }
  }
}
