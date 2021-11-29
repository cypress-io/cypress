import Observable from 'zen-observable'

import Bluebird from 'bluebird'

import type { DataContext } from '..'
import { LoadingConfig, LoadingContainer, makeLoadingContainer } from '../util/makeLoadingContainer'
import type { FullConfig } from '@packages/types'

/**
 * Standardizes handling asynchronous actions which take long enough
 * to warrant a UI loading state / error handling.
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

  /**
   * Loads the global projects from the cache
   */
  globalProjects = this.loadingContainer({
    name: 'globalProjects',
    action: () => this.ctx._apis.projectApi.getProjectRootsFromCache(),
    onUpdate: (val) => {
      this.ctx.update((o) => {
        o.globalProjects = val
      })

      this.ctx.emitter.toLaunchpad()
    },
  })

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
        o.localSettings = val
      })
    },
  })

  machineBrowsers = this.loadingContainer({
    name: 'machineBrowsers',
    action: () => this.ctx._apis.appApi.getBrowsers(),
    onUpdate: (val) => {
      this.ctx.update((o) => {
        o.app.machineBrowsers = val
      })
    },
  })

  projectConfig = this.loadingContainer({
    name: 'projectConfig',
    action: () => {
      // Explicitly throwing here since this should never happen
      if (!this.ctx.currentProject?.projectRoot) {
        throw new Error('Cannot load projectConfig without active project')
      }

      return this.ctx._apis.projectApi.getConfig(this.ctx.currentProject.projectRoot)
    },
    onUpdate: (val) => {
      this.ctx.update((o) => {
        if (o.currentProject) {
          o.currentProject.config = val
        }
      })
    },
  })

  projectEventSetup = this.loadingContainer({
    name: 'projectEventSetup',
    action: () => {
      return new Observable<FullConfig>((o) => {
        this.ctx.actions.projectConfig?.refreshProjectConfig()

        return () => {
          this.ctx.update((o) => {
            o.currentProject
          })
        }
      })
    },
    onUpdate: (val) => {
      this.ctx.update((o) => {
        if (o.currentProject) {
          o.currentProject.pluginLoad = val
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
  private loadingContainer<T, E> (config: LoadingConfig<T, E>) {
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
