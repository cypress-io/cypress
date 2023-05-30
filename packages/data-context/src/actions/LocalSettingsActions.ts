import { AllowedState, defaultPreferences, Editor } from '@packages/types'
import pDefer from 'p-defer'
import _ from 'lodash'

import type { DataContext } from '..'

export interface LocalSettingsApiShape {
  getAvailableEditors(): Promise<Editor[]>

  getPreferences (): Promise<AllowedState>
  setPreferences (object: AllowedState): Promise<void>
}

// Combine two objects into one either using Lodash merge strategy or the spread operator
function combine (first: Object = {}, second: Object = {}, merge: boolean) {
  if (merge) {
    return _.merge(first, second)
  }

  return { ...first, ...second }
}

export class LocalSettingsActions {
  constructor (private ctx: DataContext) {}

  async setPreferences (stringifiedJson: string, type: 'global' | 'project', merge: boolean = true) {
    const toJson = JSON.parse(stringifiedJson) as AllowedState

    if (type === 'global') {
      // update local data on server
      combine(this.ctx.coreData.localSettings.preferences, toJson, merge)

      // persist to global appData - projects/__global__/state.json
      const currentGlobalPreferences = await this.ctx._apis.localSettingsApi.getPreferences()
      const combinedResult = combine(currentGlobalPreferences, toJson, merge)

      return this.ctx._apis.localSettingsApi.setPreferences(combinedResult)
    }

    const currentLocalPreferences = this.ctx._apis.projectApi.getCurrentProjectSavedState()
    const combinedResult = combine(currentLocalPreferences, toJson, merge)

    // persist to project appData - for example projects/launchpad/state.json
    return this.ctx._apis.projectApi.setProjectPreferences(combinedResult)
  }

  async refreshLocalSettings () {
    if (this.ctx.coreData.localSettings?.refreshing) {
      return
    }

    const dfd = pDefer<Editor[]>()

    this.ctx.coreData.localSettings.refreshing = dfd.promise

    // TODO(tim): global unhandled error concept
    const availableEditors = await this.ctx._apis.localSettingsApi.getAvailableEditors()

    this.ctx.coreData.localSettings.availableEditors = availableEditors
    this.ctx.coreData.localSettings.preferences = {
      ...defaultPreferences,
      ...(await this.ctx._apis.localSettingsApi.getPreferences()),
    }

    dfd.resolve()
  }
}
