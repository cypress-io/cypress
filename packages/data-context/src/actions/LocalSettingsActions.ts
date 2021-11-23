import type { DevicePreferences, Editor } from '@packages/types'
import pDefer from 'p-defer'

import type { DataContext } from '..'

export interface LocalSettingsApiShape {
  setPreferredOpener(editor: Editor): Promise<void>
  getAvailableEditors(): Promise<Editor[]>

  getPreferences (): Promise<DevicePreferences>
  setDevicePreference<K extends keyof DevicePreferences> (key: K, value: DevicePreferences[K]): Promise<void>
}

export class LocalSettingsActions {
  constructor (private ctx: DataContext) {}

  setDevicePreference<K extends keyof DevicePreferences> (key: K, value: DevicePreferences[K]) {
    this.ctx.update((o) => {
      o.localSettings.preferences[key] = value
    })

    // persist to appData
    return this.ctx._apis.localSettingsApi.setDevicePreference(key, value)
  }

  async refreshLocalSettings () {
    if (this.ctx.coreData.localSettings?.refreshing) {
      return
    }

    const dfd = pDefer<Editor[]>()

    this.ctx.update((o) => {
      o.localSettings.refreshing = dfd.promise
    })

    // TODO(tim): global unhandled error concept
    const availableEditors = await this.ctx._apis.localSettingsApi.getAvailableEditors()

    this.ctx.update((o) => {
      o.localSettings.availableEditors = availableEditors
    })

    const preferences = await this.ctx._apis.localSettingsApi.getPreferences()

    this.ctx.update((o) => {
      o.localSettings.preferences = preferences
    })

    dfd.resolve(availableEditors)
  }
}
