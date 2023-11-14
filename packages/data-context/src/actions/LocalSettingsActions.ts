import { AllowedState, defaultPreferences, Editor, NotifyCompletionStatuses } from '@packages/types'
import pDefer from 'p-defer'
import _ from 'lodash'
import Debug from 'debug'

import type { DataContext } from '..'

const debug = Debug('cypress:data-context:actions:LocalSettingsActions')

export interface LocalSettingsApiShape {
  getAvailableEditors(): Promise<Editor[]>

  getPreferences (): Promise<AllowedState>
  setPreferences (object: AllowedState): Promise<void>
}

// If the value being merged is an array, replace it rather than merging the array items together
function customizer (objValue: any, srcValue: any) {
  if (_.isArray(objValue)) {
    return srcValue
  }
}

export class LocalSettingsActions {
  constructor (private ctx: DataContext) {}

  async setPreferences (stringifiedJson: string, type: 'global' | 'project') {
    const toJson = JSON.parse(stringifiedJson) as AllowedState

    if (type === 'global') {
      // update local data on server
      _.mergeWith(this.ctx.coreData.localSettings.preferences, toJson, customizer)

      // persist to global appData - projects/__global__/state.json
      const currentGlobalPreferences = await this.ctx._apis.localSettingsApi.getPreferences()
      const combinedResult = _.mergeWith(currentGlobalPreferences, toJson, customizer)

      return this.ctx._apis.localSettingsApi.setPreferences(combinedResult)
    }

    const currentLocalPreferences = this.ctx._apis.projectApi.getCurrentProjectSavedState()
    const combinedResult = _.mergeWith(currentLocalPreferences, toJson, customizer)

    // persist to project appData - for example projects/launchpad/state.json
    return this.ctx._apis.projectApi.setProjectPreferences(combinedResult)
  }

  async refreshLocalSettings () {
    if (this.ctx.coreData.localSettings?.refreshing) {
      return
    }

    debug('refresh local settings')

    const dfd = pDefer<Editor[]>()

    this.ctx.coreData.localSettings.refreshing = dfd.promise

    // TODO(tim): global unhandled error concept
    const availableEditors = await this.ctx._apis.localSettingsApi.getAvailableEditors()

    this.ctx.coreData.localSettings.availableEditors = availableEditors
    this.ctx.coreData.localSettings.preferences = {
      ...defaultPreferences,
      ...(await this.ctx._apis.localSettingsApi.getPreferences()),
    }

    const preferences = this.ctx.coreData.localSettings.preferences

    // Fix bad value for notifyWhenRunCompletes.  See https://github.com/cypress-io/cypress/issues/27228
    if (typeof preferences.notifyWhenRunCompletes === 'boolean') {
      if (preferences.notifyWhenRunCompletes === true) {
        preferences.notifyWhenRunCompletes = [...NotifyCompletionStatuses]
      } else {
        preferences.notifyWhenRunCompletes = []
      }

      await this.ctx._apis.localSettingsApi.setPreferences(preferences)
    }

    dfd.resolve()
  }
}
