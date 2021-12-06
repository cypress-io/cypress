import assert from 'assert'
import Bluebird from 'bluebird'
import { castDraft } from 'immer'
import * as configUtils from '@packages/config'
import type { DataContext } from '..'
import { LoadingConfig, LoadingContainer, makeLoadingContainer } from '../util/makeLoadingContainer'

/**
 * Standardizes handling asynchronous actions which either need "reloading", or
 * take long enough to warrant a UI loading state / error handling.
 */
export class LoadingManager {
  constructor (private ctx: DataContext) {}

  /**
   * Keeps track of all of the loading containers so we can tear them down
   * when we are cleaning up the context for testing purposes
   */
  private _loadingContainers: Map<string, LoadingContainer<any>> = new Map()

  /**
   * Called when we switch the current project (global mode), clears any loaders
   * assocated with the current project
   */
  resetCurrentProject () {
    this.projectConfig.reset()
    this.setupNodeEvents.reset()
    this.projectEnvConfig.reset()
  }

  // appState = this.loadingContainer({
  //   name: 'appState',
  //   action: () => this.ctx._apis.appApi.
  // })

  /**
   * In global open mode, loads the project paths from the cache
   * so we can access them
   */
  globalProjects = this.loadingContainer({
    name: 'globalProjects',
    action: () => this.ctx._apis.projectApi.getProjectRootsFromCache(),
    onUpdate: (val) => {
      this.ctx.update((s) => {
        s.globalProjects = castDraft(val)
      })

      this.ctx.emitter.toLaunchpad()
    },
  })

  /**
   * Loads the preferences for the user
   */
  localSettings = this.loadingContainer({
    name: 'localSettings',
    action: () => {
      return Bluebird.props({
        preferences: this.ctx._apis.localSettingsApi.getPreferences(),
        availableEditors: this.ctx._apis.localSettingsApi.getAvailableEditors(),
      })
    },
    onUpdate: (val) => {
      this.ctx.update((s) => {
        s.localSettings = castDraft(val)
      })
    },
  })

  configAppState = this.loadingContainer({
    name: 'configAppState',
    action: async () => null,
    onUpdate: (val) => {
      this.ctx.update((s) => {
        if (s.currentProject) {
          s.currentProject.configAppState = val
        }
      })
    },
  })

  machineBrowsers = this.loadingContainer({
    name: 'machineBrowsers',
    action: () => this.ctx._apis.appApi.getBrowsers(),
    onUpdate: (val) => {
      this.ctx.update((s) => {
        s.machineBrowsers = castDraft(val)
      })
    },
  })

  projectEnvConfig = this.loadingContainer({
    name: 'projectEnvConfig',
    action: async () => {
      //
      return null
    },
    onUpdate: (val) => {
      this.ctx.update((s) => {
        if (s.currentProject) {
          s.currentProject.configEnvFile = castDraft(val)
        }
      })
    },
  })

  /**
   * Sources the project config by executing the script containing the config,
   * and returning that data once it's sourced, or handling the error if one exists
   */
  projectConfig = this.loadingContainer({
    name: 'projectConfig',
    action: async () => {
      assert(this.ctx.actions.projectConfig, 'projectConfig should exist')

      return this._refeshConfigProcess()
    },
    onUpdate: (val) => {
      this.ctx.update((s) => {
        if (s.currentProject) {
          s.currentProject.configFileContents = castDraft(val)
        }
      })
    },
    onCancelled: (val) => {
      this.ctx.actions.projectConfig?.killChildProcess()
    },
  })

  /**
   * The project event setup involves sourcing the child-process containing the config,
   * and then using that to
   */
  setupNodeEvents = this.loadingContainer({
    name: 'setupNodeEvents',
    action: async () => {
      assert(this.ctx.actions.projectConfig, 'expected projectConfig in setupNodeEvents')
      assert(this.ctx.currentProject?.configChildProcess?.ipc, 'Expected config ipc in setupNodeEvents')

      // If we have already executed plugins for the config file, we need to source a new one
      if (this.ctx.currentProject.configChildProcess.executedPlugins || !this.ctx.currentProject?.configChildProcess) {
        await this._refeshConfigProcess()
      }

      const data = await this.ctx.actions.projectConfig.runSetupNodeEvents(
        this.ctx.currentProject.configChildProcess.ipc,
      )

      const configFilePath = this.ctx.project?.relativeConfigFilePath

      if (data?.result) {
        configUtils.validate(data.result, (errMsg) => {
          throw this.ctx.error('PLUGINS_CONFIG_VALIDATION_ERROR', configFilePath, errMsg)
        })

        // configUtils.validateNoBreakingConfig(data.result)
      }

      return data
    },
    onUpdate: (val) => {
      this.ctx.update((s) => {
        if (s.currentProject) {
          s.currentProject.configSetupNodeEvents = castDraft(val)
          if (val.settled && s.currentProject.configChildProcess) {
            s.currentProject.configChildProcess.executedPlugins = s.currentProject.currentTestingType
          }

          if (val.state === 'LOADED') {
            s.currentProject.pluginRegistry = val.value.registeredEvents
          } else {
            s.currentProject.pluginRegistry = null
          }
        }
      })
    },
  })

  destroy () {
    for (const [k, v] of this._loadingContainers.entries()) {
      v.reset()
      this._loadingContainers.delete(k)
    }
  }

  private async _refeshConfigProcess () {
    assert(this.ctx.actions.projectConfig)
    // Kill the existing child process, if one already exists
    this.ctx.currentProject?.configChildProcess?.process().kill()

    const { configPromise } = this.ctx.actions.projectConfig.refreshConfigProcess()
    const result = await configPromise

    configUtils.validate(result, (errMsg) => {
      throw this.ctx.error('SETTINGS_VALIDATION_ERROR', this.ctx.currentProject?.configFile, errMsg)
    })

    return result as Cypress.ConfigOptionsIpcResponse
  }

  /**
   * Creates a new "loading container", a class which manages the lifecycle
   * of a long-lived async operation, including the ability to "cancel"
   * the operation while in-flight.
   */
  private loadingContainer<T, E = any> (config: LoadingConfig<T, E>) {
    const container = makeLoadingContainer(config)

    if (this._loadingContainers.has(config.name)) {
      throw new Error(`Cannot have multiple loaders named ${config.name}`)
    }

    this._loadingContainers.set(config.name, container)

    return container
  }
}
