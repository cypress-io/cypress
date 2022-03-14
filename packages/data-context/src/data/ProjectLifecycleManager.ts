/**
 * The "Project Lifecycle" is the centralized manager for the project,
 * config, browser, and the number of possible states that can occur based
 * on inputs that change these behaviors.
 *
 * See `guides/app-lifecycle.md` for documentation on the project & possible
 * states that exist, and how they are managed.
 */
import path from 'path'
import resolve from 'resolve'
import pDefer from 'p-defer'
import fs from 'fs'

import { getError, CypressError, ConfigValidationFailureInfo } from '@packages/errors'
import type { DataContext } from '..'
import type { AllModeOptions, BreakingErrResult, BreakingOption, FullConfig, TestingType } from '@packages/types'
import { ProjectConfigManager } from './ProjectConfigManager'
import type { IpcHandler } from './ProjectConfigIpc'
import { getProjectMetaState, ProjectMetaState } from '../sources/project/getProjectMetaState'
import assert from 'assert'
import type { CurrentProjectState } from './coreDataShape'

export interface SetupFullConfigOptions {
  projectName: string
  projectRoot: string
  cliConfig: Partial<Cypress.ConfigOptions>
  config: Partial<Cypress.ConfigOptions>
  envFile: Partial<Cypress.ConfigOptions>
  options: Partial<AllModeOptions>
}

type BreakingValidationFn<T> = (type: BreakingOption, val: BreakingErrResult) => T

/**
 * All of the APIs injected from @packages/server & @packages/config
 * since these are not strictly typed
 */
export interface InjectedConfigApi {
  cypressVersion: string
  /**
   * Functions that exist throughout the app that tap into IPC events
   */
  getServerPluginHandlers: () => IpcHandler[]
  validateConfig<T extends Cypress.ConfigOptions>(config: Partial<T>, onErr: (errMsg: ConfigValidationFailureInfo | string) => never): T
  allowedConfig(config: Cypress.ConfigOptions): Cypress.ConfigOptions
  updateWithPluginValues(config: FullConfig, modifiedConfig: Partial<Cypress.ConfigOptions>): FullConfig
  setupFullConfigWithDefaults(config: SetupFullConfigOptions): Promise<FullConfig>
  validateRootConfigBreakingChanges<T extends Cypress.ConfigOptions>(config: Partial<T>, onWarning: BreakingValidationFn<CypressError>, onErr: BreakingValidationFn<never>): void
  validateTestingTypeConfigBreakingChanges<T extends Cypress.ConfigOptions>(config: Partial<T>, testingType: Cypress.TestingType, onWarning: BreakingValidationFn<CypressError>, onErr: BreakingValidationFn<never>): void
}

// The ProjectLifecycleManager is responsible for managing the "meta state"
// of the project & acting as a monitor for the config manager.
// We create a new one of these whenever we change the projectRoot.
export class ProjectLifecycleManager {
  constructor (private ctx: DataContext, readonly projectRoot: string) {
    this.legacyPluginGuard(projectRoot)
    this.verifyProjectRoot(projectRoot)
    const metaState = getProjectMetaState(projectRoot, this.ctx.modeOptions.configFile)

    this.configFileWarningCheck(metaState)
    ctx.update((d) => {
      d.currentProjectState?.manager?.destroy()
      d.currentProjectState = {
        manager: this,
        initialConfig: null,
        finalConfig: null,
        metaState,
        state: 'pending',
        initializedProject: null,
        configManager: this._makeConfigManager(projectRoot),
      }
    })
  }

  get currentState () {
    assert(this.ctx.coreData.currentProjectState)

    return this.ctx.coreData.currentProjectState
  }

  get metaState () {
    return this.currentState.metaState
  }

  get configManager () {
    return this.currentState.configManager
  }

  // Create a new ProjectConfigManager - this is the container for all state
  // associated with the child process, config loading, node events, etc.
  // We tear it down & reload when we detect file changes that would affect the
  // state of the process. This is a helper function to
  private _makeConfigManager (projectConfigPath: string) {
    return new ProjectConfigManager({
      projectConfigPath,
      modeOptions: this.ctx.modeOptions,
      isRunMode: this.ctx.isRunMode,
      projectRoot: this.projectRoot,
      machineBrowsers: this.ctx.browser.machineBrowsers(),
      configApis: this.ctx._apis.configApi,
      onError: this.onError,
      onWarning: this.ctx.onWarning,
      onReady: this.onReady,
      triggerRespawn: this.triggerRespawn,
      currentTestingType: this.ctx.coreData.currentTestingType ?? null,
    })
  }

  // Called internally by the currently running config manager when we detect a file change
  // or something that otherwise needs to
  private async triggerRespawn () {
    this.ctx.update((d) => {
      d.app.isReloadingConfigProcess = true
    })

    this.configManager?.destroy()
    this.update((d) => {
      d.configManager = this._makeConfigManager(this.configFilePath)
    })
  }

  async initialize () {
    if (this.metaState?.needsCypressJsonMigration) {
      return
    }

    try {
      await this.configManager.initialize()
    } catch (e) {
      this.onError(e)
    }
  }

  async getProjectId (): Promise<string | null> {
    try {
      const contents = await this.configManager?.getFullInitialConfig()

      return contents?.projectId ?? null
    } catch {
      return null
    }
  }

  get ipcReady (): boolean {
    return Boolean(this.configManager?.isIpcReady)
  }

  get configFile () {
    return this.ctx.modeOptions.configFile ?? 'cypress.config.js'
  }

  get configFilePath () {
    if (this.configFile === false) {
      // TODO(tgriesser): validate & write proper error here
      throw new Error('configFile is false')
    }

    return path.resolve(this.projectRoot, this.configFile)
  }

  get browsers () {
    return this.getFullFinalConfig()?.then((c) => c?.browsers)
  }

  get eventProcessPid () {
    return this.configManager?.eventProcessPid
  }

  // Used by the GraphQL field resolver
  get isLoadingConfigFile () {
    return Boolean(this.ctx.coreData.currentProjectState?.initialConfig)
  }

  // Used by the GraphQL field resolver
  get isLoadingNodeEvents () {
    return Boolean(this.ctx.coreData.currentProjectState?.finalConfig)
  }

  get projectTitle () {
    return path.basename(this.projectRoot)
  }

  async checkIfLegacyConfigFileExist () {
    const legacyConfigFileExist = await this.ctx.deref.actions.file.checkIfFileExists(this.legacyConfigFile)

    return Boolean(legacyConfigFileExist)
  }

  clearCurrentProject () {
    this.configManager?.destroy()
  }

  private update (fn: (state: CurrentProjectState) => void) {
    this.ctx.update((d) => {
      if (d.currentProjectState && d.currentProject === this.projectRoot) {
        fn(d.currentProjectState)
      }
    })
  }

  refreshMetaState () {
    this.update((d) => {
      d.metaState = getProjectMetaState(this.projectRoot)
    })
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

    if (this.configManager?.testingType === testingType) {
      return
    }

    // If we're setting to null, or there's already a loaded testing type,
    // we need to reload the config.
    if (!testingType || this.configManager?.testingType) {
      this.configManager?.destroy()
    }

    if (!testingType) {
      return
    }

    if (this.isTestingTypeConfigured(testingType) && !(this.ctx.coreData.forceReconfigureProject?.[testingType])) {
      this.configManager?.setCurrentTestingType(testingType)
    }
  }

  /**
   * Invoked when we have "initialized" the entire project / child process,
   * used to signal to the client that the config is ready
   */
  private onReady (config: FullConfig) {
    if (this.ctx.coreData.pendingRunModeInitialize) {
      this.ctx.coreData.pendingRunModeInitialize.resolve(config)
    } else {
      this.ctx.emitter.toLaunchpad()
      this.ctx.emitter.toApp()
    }
  }

  private resetInternalState () {
    this.configManager?.destroy()
  }

  /**
   * Equivalent to the legacy "config.get()",
   * this sources the config from the various config sources
   */
  async getFullInitialConfig (options: Partial<AllModeOptions> = this.ctx.modeOptions, withBrowsers = true): Promise<FullConfig> {
    return this.configManager.getFullInitialConfig(options, withBrowsers)
  }

  /**
   * Resolves with the "final" config once the IPC has been established
   */
  async getFullFinalConfig (): Promise<FullConfig | undefined> {
    return this.configManager?.getFullFinalConfig()
  }

  async getConfigFileContents () {
    if (this.ctx.modeOptions.configFile === false) {
      return {}
    }

    return this.getFullInitialConfig()
  }

  /**
   * Reloads the config, used whenever we know that something has
   */
  reloadConfig () {
    //
  }

  /**
   * Reinitializes Cypress, used when we "try again" from an error screen that we can't
   * recover from.
   */
  reinitializeCypress () {
    this.configManager?.destroy()
  }

  hasNodeEvent (eventName: string) {
    return Boolean(this.configManager?.hasNodeEvent(eventName))
  }

  executeNodeEvent (event: string, args: any[]) {
    return this.configManager?.executeNodeEvent(event, args)
  }

  private legacyPluginGuard (projectRoot: string) {
    // test and warn for incompatible plugin
    try {
      const retriesPluginPath = path.dirname(resolve.sync('cypress-plugin-retries/package.json', {
        basedir: projectRoot,
      }))

      this.ctx.onWarning(getError('INCOMPATIBLE_PLUGIN_RETRIES', path.relative(projectRoot, retriesPluginPath)))
    } catch (e) {
      // noop, incompatible plugin not installed
    }
  }

  setConfigFilePath (lang: 'ts' | 'js') {
    this._configFilePath = this._pathToFile(`cypress.config.${lang}`)
  }

  private verifyProjectRoot (projectRoot: string) {
    try {
      if (!fs.statSync(projectRoot).isDirectory()) {
        throw new Error('NOT DIRECTORY')
      }
    } catch (err) {
      throw getError('NO_PROJECT_FOUND_AT_PROJECT_ROOT', projectRoot)
    }
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
  }

  async initializeOpenMode () {
    this.configManager = this._makeConfigManager(this.configFilePath)
  }

  // For run mode, we have a pending initialize promise that keeps track of the
  //
  async initializeRunMode () {
    assert(!this.ctx.coreData.pendingRunModeInitialize, 'Already initializing')

    const runModeInitialize = pDefer<FullConfig>()

    this.ctx.update((d) => {
      d.pendingRunModeInitialize = runModeInitialize
    })

    this.update((d) => {
      d.metaState ??= getProjectMetaState(this.projectRoot)
    })

    if (!this.metaState.hasValidConfigFile) {
      return this.ctx.onError(getError('NO_DEFAULT_CONFIG_FILE_FOUND', this.projectRoot))
    }

    if (!this.configManager?.testingType) {
      // e2e is assumed to be the default testing type if
      // none is passed in run mode
      this.setCurrentTestingType('e2e')
    }

    return runModeInitialize.promise.finally(() => {
      this.ctx.update((d) => {
        delete d.pendingRunModeInitialize
      })
    })
  }

  private configFileWarningCheck (metaState: ProjectMetaState) {
    // Only if they've explicitly specified a config file path do we error, otherwise they'll go through onboarding
    if (!metaState.hasValidConfigFile && metaState.hasSpecifiedConfigViaCLI !== false && this.ctx.isRunMode) {
      this.onError(getError('CONFIG_FILE_NOT_FOUND', path.basename(metaState.hasSpecifiedConfigViaCLI), path.dirname(metaState.hasSpecifiedConfigViaCLI)))
    }

    if (metaState.hasLegacyCypressJson && !metaState.hasValidConfigFile && this.ctx.isRunMode) {
      this.onError(getError('CONFIG_FILE_MIGRATION_NEEDED', this.projectRoot))
    }

    if (metaState.hasMultipleConfigPaths) {
      this.onError(getError('CONFIG_FILES_LANGUAGE_CONFLICT', this.projectRoot, 'cypress.config.js', 'cypress.config.ts'))
    }

    if (metaState.hasValidConfigFile && metaState.hasLegacyCypressJson) {
      this.onError(getError('LEGACY_CONFIG_FILE', path.basename(this.configFilePath), this.projectRoot))
    }
  }

  // When there is an error during any part of the lifecycle
  // initiation, we pass it through here. This allows us to intercept
  // centrally in the e2e tests, as well as notify the "pending initialization"
  // for run mode
  private onError = (err: any) => {
    if (this.ctx.isRunMode && this.ctx.coreData.pendingRunModeInitialize) {
      this.ctx.coreData.pendingRunModeInitialize.reject(err)
    } else {
      this.ctx.onError(err, 'Error Loading Config')
    }
  }
}
