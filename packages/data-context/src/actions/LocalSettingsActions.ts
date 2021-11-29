import type { DevicePreferences, Editor } from '@packages/types'
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
      if (o.localSettings.state === 'LOADED') {
        o.localSettings.value.preferences[key] = value
      }
    })

    return this.ctx._apis.localSettingsApi.setDevicePreference(key, value)
  }

  async refreshLocalSettings () {
    this.ctx.loadingManager.localSettings.reload()
  }
}
