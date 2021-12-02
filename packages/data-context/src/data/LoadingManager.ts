import assert from 'assert'
import Bluebird from 'bluebird'
import { castDraft } from 'immer'
import configUtils from '@packages/config'
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
  private _withinReset: boolean = false

  /**
   * Called when we switch the current project (global mode), clears any loaders
   * assocated with the current project
   */
  resetCurrentProject () {
    this.withinReset(() => {
      this.projectConfig = this.projectConfig.reset()
      this.projectEventSetup = this.projectEventSetup.reset()
    })
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
      this.ctx.update((o) => {
        o.globalProjects = castDraft(val)
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
      this.ctx.update((o) => {
        o.localSettings = castDraft(val)
      })
    },
  })

  /**
   * Fetches the global browsers on the machine
   */
  machineBrowsers = this.loadingContainer({
    name: 'machineBrowsers',
    action: () => this.ctx._apis.appApi.getBrowsers(),
    onUpdate: (val) => {
      this.ctx.update((o) => {
        o.machineBrowsers = castDraft(val)
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
      this.ctx.update((o) => {
        if (o.currentProject) {
          o.currentProject.config = castDraft(val)
        }
      })
    },
  })

  private async _refeshConfigProcess () {
    assert(this.ctx.actions.projectConfig)
    // Kill the existing child process, if one already exists
    this.ctx.currentProject?.configChildProcess?.process.kill()

    const { configPromise } = this.ctx.actions.projectConfig.refreshConfigProcess()
    const result = await configPromise

    configUtils.validate(result, (errMsg) => {
      throw this.ctx.error('SETTINGS_VALIDATION_ERROR', this.ctx.currentProject?.configFile, errMsg)
    })

    return result
  }

  /**
   * The project event setup involves sourcing the child-process containing the config,
   * and then using that to
   */
  projectEventSetup = this.loadingContainer({
    name: 'projectEventSetup',
    action: async () => {
      assert(this.ctx.actions.projectConfig, 'expected projectConfig in projectEventSetup')
      assert(this.ctx.currentProject?.configChildProcess?.ipc, 'Expected config ipc in projectEventSetup')

      // If we have already executed plugins for the config file, we need to source a new one
      if (this.ctx.currentProject.configChildProcess.executedPlugins || !this.ctx.currentProject?.configChildProcess) {
        await this._refeshConfigProcess()
      }

      return this.ctx.actions.projectConfig.runSetupNodeEvents(
        this.ctx.currentProject.configChildProcess.ipc,
      )
    },
    onUpdate: (val) => {
      this.ctx.update((o) => {
        if (o.currentProject) {
          o.currentProject.pluginLoad = castDraft(val)
          if (val.state === 'LOADED' && val.value?.registeredEvents) {
            o.currentProject.pluginRegistry = val.value.registeredEvents
          }
        }
      })
    },
  })

  destroy () {
    for (const [k, v] of this._loadingContainers.entries()) {
      v.cancel()
      this._loadingContainers.delete(k)
    }
  }

  /**
   * Creates a new "loading container", a class which manages the lifecycle
   * of a long-lived async operation, including the ability to "cancel"
   * the operation while in-flight.
   */
  private loadingContainer<T, E = any> (config: LoadingConfig<T, E>) {
    const container = makeLoadingContainer(config)

    if (this._loadingContainers.has(config.name) && !this._withinReset) {
      throw new Error(`Cannot have multiple loaders named ${config.name}`)
    }

    this._loadingContainers.set(config.name, container)

    return container
  }

  private withinReset (fn: () => void) {
    this._withinReset = true
    fn()
    this._withinReset = false
  }
}
