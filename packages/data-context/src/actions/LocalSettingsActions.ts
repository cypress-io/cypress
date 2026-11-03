import { defaultPreferences, NotifyCompletionStatuses } from '@packages/types'
import type { AllowedState, Editor } from '@packages/types'
import _ from 'lodash'
import Debug from 'debug'

import type { DataContext } from '..'
import { isLaunchableEditor } from '../util/isLaunchableEditor'

const debug = Debug('cypress:data-context:actions:LocalSettingsActions')

export interface LocalSettingsApiShape {
  getAvailableEditors(): Promise<Editor[]>

  getPreferences (): Promise<AllowedState>
  setPreferences (object: AllowedState): Promise<void>
}

// Preferences that are written as a complete snapshot rather than a patch. Deep-merging one of
// these would keep entries the client has since dropped, so nothing could ever be removed.
const replacedPreferences: ReadonlyArray<keyof AllowedState> = ['specsListTreeExpansion']

// If the value being merged is an array, replace it rather than merging the array items together
const makeCustomizer = (target: unknown) => {
  return (objValue: any, srcValue: any, key: string, object: unknown) => {
    if (_.isArray(objValue)) {
      return srcValue
    }

    // Only a top-level preference is a snapshot, so a nested key that happens to share a name
    // with one is still merged normally.
    if (object === target && replacedPreferences.includes(key as keyof AllowedState)) {
      return srcValue
    }
  }
}

export class LocalSettingsActions {
  constructor (private ctx: DataContext) {}

  async setPreferences (stringifiedJson: string, type: 'global' | 'project') {
    const toJson = JSON.parse(stringifiedJson) as AllowedState

    if (toJson.preferredEditorBinary) {
      await this.ctx.coreData.localSettings.refreshing

      if (!isLaunchableEditor(this.ctx.coreData.localSettings.availableEditors, toJson.preferredEditorBinary)) {
        throw new Error(`Cannot set the preferred editor to one Cypress did not detect: ${toJson.preferredEditorBinary}`)
      }
    }

    if (type === 'global') {
      // update local data on server
      const localPreferences = this.ctx.coreData.localSettings.preferences

      _.mergeWith(localPreferences, toJson, makeCustomizer(localPreferences))

      // persist to global appData - projects/__global__/state.json
      const currentGlobalPreferences = await this.ctx._apis.localSettingsApi.getPreferences()
      const combinedResult = _.mergeWith(currentGlobalPreferences, toJson, makeCustomizer(currentGlobalPreferences))

      return this.ctx._apis.localSettingsApi.setPreferences(combinedResult)
    }

    const currentLocalPreferences = this.ctx._apis.projectApi.getCurrentProjectSavedState()
    const combinedResult = _.mergeWith(currentLocalPreferences, toJson, makeCustomizer(currentLocalPreferences))

    // persist to project appData - for example projects/launchpad/state.json
    return this.ctx._apis.projectApi.setProjectPreferences(combinedResult)
  }

  async getLaunchableEditor (): Promise<string | undefined> {
    await this.ctx.coreData.localSettings.refreshing

    const binary = this.ctx.coreData.localSettings.preferences.preferredEditorBinary

    return isLaunchableEditor(this.ctx.coreData.localSettings.availableEditors, binary) ? binary : undefined
  }

  async refreshLocalSettings () {
    if (this.ctx.coreData.localSettings?.refreshing) {
      return
    }

    debug('refresh local settings')

    const dfd = Promise.withResolvers<Editor[]>()

    this.ctx.coreData.localSettings.refreshing = dfd.promise

    try {
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
    } catch (e) {
      // Clear it so a later refresh can retry instead of every caller seeing the failed one
      this.ctx.coreData.localSettings.refreshing = null

      throw e
    } finally {
      dfd.resolve(this.ctx.coreData.localSettings.availableEditors)
    }
  }
}
