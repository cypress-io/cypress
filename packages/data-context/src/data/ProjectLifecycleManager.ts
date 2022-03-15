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
import debugLib from 'debug'
import pDefer from 'p-defer'
import fs from 'fs'

import { getError, CypressError } from '@packages/errors'

import { ProjectConfigIpc, IpcHandler, FileChange } from './ProjectConfigIpc'
import assert from 'assert'
import type { AllModeOptions, FoundBrowser, FullConfig, TestingType } from '@packages/types'
import type { LegacyCypressConfigJson } from '../sources'
import type { DataContext } from '../DataContext'

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

/**
 * All of the APIs injected from @packages/server & @packages/config
 * since these are not strictly typed
 */
export interface InjectedConfigApi {
  cypressVersion: string
  getServerPluginHandlers: () => IpcHandler[]
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
  // Registered handlers from Cypress's server, used to wrap the IPC
  private _handlers: IpcHandler[] = []

  private _configIpc?: ProjectConfigIpc
  private _currentTestingType: TestingType | null = null
  private _runModeExitEarly: ((error: Error) => void) | undefined

  private _initializedProject: unknown | undefined // open_project object
  private _projectRoot: string | undefined
  private _configFilePath: string | undefined

  private _cachedFullConfig: FullConfig | undefined

  private _projectMetaState: ProjectMetaState = { ...PROJECT_META_STATE }

  constructor (private ctx: DataContext) {
    if (ctx.coreData.currentProject) {
      this.setCurrentProject(ctx.coreData.currentProject)
    } else if (ctx.coreData.currentTestingType && this._projectRoot) {
      this.setCurrentTestingType(ctx.coreData.currentTestingType)
    }
  }

  private onProcessExit = () => {
    this.resetInternalState()
  }

  async getProjectId (): Promise<string | null> {
    try {
      const contents = await this.getConfigFileContents()

      return contents?.projectId ?? null
    } catch {
      return null
    }
  }

  get configIpc () {
    return this._configIpc
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

  #_configFile = 'cypress.config.js'

  get configFile () {
    return this.ctx.modeOptions.configFile ?? 'cypress.config.js'
  }

  get configFilePath () {
    assert(this._configFilePath, 'Expected configFilePath to be found')

    return this._configFilePath
  }

  get browsers () {
    if (this.#initialFullConfigLoaded) {
      return this.#initialFullConfigLoaded.browsers as FoundBrowser[]
    }

    return null
  }

  get isLoadingConfigFile () {
    return Boolean(!this._configIpc || (this._configIpc?.state === 'loadingConfig'))
  }

  get isLoadingNodeEvents () {
    return Boolean(this._configIpc?.state === 'loadingNodeEvents')
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

  async checkIfLegacyConfigFileExist () {
    const legacyConfigFileExist = await this.ctx.deref.actions.file.checkIfFileExists(this.legacyConfigFile)

    return Boolean(legacyConfigFileExist)
  }

  clearCurrentProject () {
    this.resetInternalState()
    this._initializedProject = undefined
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

  /**
   * When we set the current project, we need to cleanup the
   * previous project that might have existed. We use this as the
   * single location we should use to set the `projectRoot`, because
   * we can call it from legacy code and it'll be a no-op if the `projectRoot`
   * is already the same, otherwise it'll do the necessary cleanup
   */
  setCurrentProject (projectRoot: string) {
    debug('setCurrentProject %s, current %s', projectRoot, this._projectRoot)

    if (this._projectRoot === projectRoot) {
      return
    }

    const isInProject = Boolean(this._projectRoot)

    this._projectRoot = projectRoot

    const metaState = this.refreshMetaState()

    debug('setCurrentProject metaState %o', metaState)

    // Determine if this is a "good" project or one needing to be migrated
    if (metaState.needsCypressJsonMigration) {
      const legacyConfigPath = path.resolve(projectRoot, this.legacyConfigFile)

      if (!this.ctx.isRunMode && this.ctx.fs.existsSync(legacyConfigPath)) {
        this.#legacyMigration(legacyConfigPath)
      }

      return
    }

    // The "IPC" is an EventEmitter wrapping the child process, adding a "send"
    // method, and re-emitting any "message" that comes through the channel through the EventEmitter.
    // It also acts as the state container & manager for the sourcing of all config related to the project.
    const ipc = this._configIpc = this._makeProjectIpc()

    this.ctx.update((d) => {
      d.currentProject = projectRoot
      d.currentProjectIpc?.destroy()
      d.currentProjectIpc = ipc
      if (isInProject) {
        d.currentTestingType = null
        this._currentTestingType = null
      }
    })

    ipc.initializeConfig()
    this.#legacyPluginGuard()

    this._initializedProject = undefined
    const packageManagerUsed = this.getPackageManagerUsed(projectRoot)

    this.resetInternalState()
    this.ctx.update((s) => {
      s.currentProject = projectRoot
      s.packageManager = packageManagerUsed
    })

    this.configFileWarningCheck()

    if (this.ctx.coreData.currentTestingType) {
      this.setCurrentTestingType(this.ctx.coreData.currentTestingType)
    }
  }

  async #legacyMigration (legacyConfigPath: string) {
    try {
      // we run the legacy plugins/index.js in a child process
      // and mutate the config based on the return value for migration
      // only used in open mode (cannot migrate via terminal)
      const legacyConfig = await this.ctx.fs.readJson(legacyConfigPath) as LegacyCypressConfigJson

      // should never throw, unless there existing pluginsFile errors out,
      // in which case they are attempting to migrate an already broken project.
      await this.ctx.actions.migration.initialize(legacyConfig)

      this.ctx.emitter.toLaunchpad()
    } catch (e) {
      this.onLoadError(e)
    }
  }

  #resolvedConfigLoaded: Partial<Cypress.ResolvedConfigOptions> | undefined
  #onResolvedConfig = (cfg: Partial<Cypress.ResolvedConfigOptions>) => {
    this.#resolvedConfigLoaded = cfg
    this.ctx.emitter.toLaunchpad() // TODO: Replace with subscription

    if (this._currentTestingType && !this.isTestingTypeConfigured(this._currentTestingType) && !this.ctx.isRunMode) {
      this.ctx.actions.wizard.scaffoldTestingType().catch(this.onLoadError)

      return
    }
  }

  #initialFullConfigLoaded: FullConfig | undefined
  #onInitialFullConfig = (cfg: FullConfig) => {
    this.#initialFullConfigLoaded = cfg
    this.ctx.emitter.toLaunchpad()
  }

  #onFileChange = (evt: FileChange) => {
    this.reloadConfig()
  }

  #onIpcReady = (fullConfig: FullConfig) => {
    this._pendingInitialize?.resolve(fullConfig)
    this.ctx.emitter.projectChange()
    this.ctx.emitter.toLaunchpad() // Todo: replace with subscription
  }

  setRunModeExitEarly (exitEarly: ((err: Error) => void) | undefined) {
    this._runModeExitEarly = exitEarly
  }

  get runModeExitEarly () {
    return this._runModeExitEarly
  }

  private _makeProjectIpc () {
    this.refreshMetaState()
    assert(this.configFile !== false)

    return new ProjectConfigIpc({
      projectRoot: this.projectRoot,
      configFile: this.#_configFile,
      nodePath: this.ctx.modeOptions.userNodePath,
      modeOptions: this.ctx.modeOptions,
      isRunMode: this.ctx.isRunMode,
      onError: this.ctx.onError,
      onWarning: this.ctx.onWarning,
      onFileChange: this.#onFileChange,
      onResolvedConfig: this.#onResolvedConfig,
      onInitialFullConfig: this.#onInitialFullConfig,
      onIpcReady: this.#onIpcReady,
      browsers: this.ctx.browser.machineBrowsers(),
      handlers: this.ctx._apis.configApi.getServerPluginHandlers(),
      setupFullConfigWithDefaults: this.ctx._apis.configApi.setupFullConfigWithDefaults,
      updateWithPluginValues: this.ctx._apis.configApi.updateWithPluginValues,
    })
  }

  /**
   * Setting the testing type should automatically handle cleanup of existing
   * processes and load the config / initialize the plugin process associated
   * with the chosen testing type.
   */
  setCurrentTestingType (testingType: TestingType | null) {
    if (this._currentTestingType === testingType) {
      return
    }

    // Destroy the IPC if we're not of the current testing type
    if (this._currentTestingType || !testingType) {
      this._configIpc?.destroy()
    }

    this.ctx.update((d) => {
      d.currentTestingType = testingType
    })

    if (!this._projectRoot) {
      return
    }

    const ipc = this._configIpc = this._makeProjectIpc()

    this.ctx.update((d) => {
      d.currentTestingType = testingType
      d.currentProjectIpc = ipc
      d.wizard.chosenBundler = null
      d.wizard.chosenFramework = null
    })

    this._initializedProject = undefined

    if (!testingType) {
      return
    }

    if (this.isTestingTypeConfigured(testingType) && !(this.ctx.coreData.forceReconfigureProject && this.ctx.coreData.forceReconfigureProject[testingType])) {
      // TODO, put this back??
    }
  }

  private resetInternalState () {
    this._configFilePath = undefined
    this.#resolvedConfigLoaded = undefined
    this.#initialFullConfigLoaded = undefined
  }

  get eventProcessPid () {
    return this._configIpc?.pid
  }

  /**
   * Equivalent to the legacy "config.get()",
   * this sources the config from the various config sources
   */
  async getFullInitialConfig (
    options: Partial<AllModeOptions> = this.ctx.modeOptions,
    withBrowsers = true,
  ): Promise<FullConfig> {
    if (this.#initialFullConfigLoaded) {
      return this.#initialFullConfigLoaded
    }

    throw new Error('TODO: Determine where / how this is needed')
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

    return this.configIpc?.getConfigFileContents()
  }

  /**
   * When we detect a change to the config file path, we call "reloadConfig".
   * This sources a fresh IPC channel & reads the config. If we detect a change
   * to the config or the list of imported files, we will re-execute the setupNodeEvents
   */
  reloadConfig () {
    this.resetInternalState()
    this._configIpc?.destroy()
    const ipc = this._configIpc = this._makeProjectIpc()

    this.ctx.update((d) => {
      d.currentProjectIpc = ipc
    })
  }

  // TODO: Determine the best place to put this logic
  // private onConfigLoaded () {
  //   if (this.ctx.coreData.scaffoldedFiles) {
  //     this.ctx.coreData.scaffoldedFiles.filter((f) => {
  //       if (f.file.absolute === this.configFilePath && f.status !== 'valid') {
  //         f.status = 'valid'
  //         this.ctx.emitter.toLaunchpad()
  //       }
  //     })
  //   }
  // }

  reinitializeCypress () {
    this.resetInternalState()
  }

  hasNodeEvent (eventName: string) {
    return Boolean(this._configIpc?.hasNodeEvent(eventName))
  }

  executeNodeEvent (event: string, args: any[]) {
    return this._configIpc?.executeNodeEvent(event, args)
  }

  #legacyPluginGuard () {
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
    debug('refreshMetaState')
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
          this.#_configFile = fileName
          this.setConfigFilePath(fileName)
        }
      }
    }

    // We finished looping through all of the possible config files
    // And we *still* didn't find anything. Set the configFilePath to JS or TS.
    if (!this._configFilePath) {
      this.#_configFile = `cypress.config.${metaState.hasTypescript ? 'ts' : 'js'}`
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

  destroy () {
    this.resetInternalState()
    // @ts-ignore
    process.removeListener('exit', this.onProcessExit)
  }

  isTestingTypeConfigured (testingType: TestingType): boolean {
    if (!this.#resolvedConfigLoaded) {
      return false
    }

    if (!_.has(this.#resolvedConfigLoaded, testingType)) {
      return false
    }

    if (testingType === 'component') {
      return Boolean(this.#resolvedConfigLoaded.component?.devServer)
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
    this._configIpc?.destroy()
    if (this.ctx.isRunMode && this._pendingInitialize) {
      this._pendingInitialize.reject(err)
    } else {
      this.ctx.onError(err, 'Error Loading Config')
    }
  }
}
