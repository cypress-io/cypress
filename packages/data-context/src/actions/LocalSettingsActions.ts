import type { AllowedState, Editor } from '@packages/types'

import type { DataContext } from '..'

export interface LocalSettingsApiShape {
  getAvailableEditors(): Promise<Editor[]>

  getPreferences (): Promise<AllowedState>
  setPreferences (object: AllowedState): Promise<void>
}

export class LocalSettingsActions {
  constructor (private ctx: DataContext) {}

  setDevicePreference (stringifiedJson: string) {
    const toJson = JSON.parse(stringifiedJson) as AllowedState

    this.ctx.update((o) => {
      if (o.localSettings.state === 'LOADED') {
        for (const [key, value] of Object.entries(toJson)) {
          o.localSettings.value[key as keyof AllowedState] = value as any
        }

        o.localSettings.value.preferences[key] = value
      }
    })

    return this.ctx._apis.localSettingsApi.setPreferences(toJson)
  }

  async refreshLocalSettings () {
    this.ctx.loadingManager.localSettings.reload()
  }
}
