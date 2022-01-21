import { AllowedState, defaultPreferences, Editor } from '@packages/types'
import pDefer from 'p-defer'

import type { DataContext } from '..'

export interface LocalSettingsApiShape {
  getAvailableEditors(): Promise<Editor[]>

  getPreferences (): Promise<AllowedState>
  setPreferences (object: AllowedState): Promise<void>
}

export class LocalSettingsActions {
  constructor (private ctx: DataContext) {}

  setPreferences (stringifiedJson: string) {
    const toJson = JSON.parse(stringifiedJson) as AllowedState

    // update local data
    for (const [key, value] of Object.entries(toJson)) {
      this.ctx.coreData.localSettings.preferences[key as keyof AllowedState] = value as any
    }

    // persist to appData
    return this.ctx._apis.localSettingsApi.setPreferences(toJson)
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
