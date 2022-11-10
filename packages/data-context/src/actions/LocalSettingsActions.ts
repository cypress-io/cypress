import { AllowedState, defaultPreferences, Editor } from '@packages/types'
import pDefer from 'p-defer'
import _ from 'lodash'

import type { DataContext } from '..'

export interface LocalSettingsApiShape {
  getAvailableEditors(): Promise<Editor[]>

  getPreferences (): Promise<AllowedState>
  setPreferences (object: AllowedState): Promise<void>
}

export class LocalSettingsActions {
  constructor (private ctx: DataContext) {}

  async setPreferences (stringifiedJson: string, type: 'global' | 'project') {
    const toJson = JSON.parse(stringifiedJson) as AllowedState

    if (type === 'global') {
      // update local data on server
      _.merge(this.ctx.coreData.localSettings.preferences, toJson)

      // persist to global appData - projects/__global__/state.json
      const currentGlobalPreferences = await this.ctx._apis.localSettingsApi.getPreferences()
      const combinedResult = _.merge(currentGlobalPreferences, toJson)

      return this.ctx._apis.localSettingsApi.setPreferences(combinedResult)
    }

    const currentLocalPreferences = this.ctx._apis.projectApi.getCurrentProjectSavedState()
    const combinedResult = _.merge(currentLocalPreferences, toJson)

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
