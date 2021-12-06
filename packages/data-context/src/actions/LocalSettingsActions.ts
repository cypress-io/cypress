import type { AllowedState, Editor } from '@packages/types'

import type { DataContext } from '..'

export interface LocalSettingsApiShape {
  getAvailableEditors(): Promise<Editor[]>
  getPreferences (): Promise<AllowedState>
  setPreferences (object: AllowedState): Promise<void>
}

export class LocalSettingsActions {
  constructor (private ctx: DataContext) {}

  setPreferences (stringifiedJson: string) {
    const toJson = JSON.parse(stringifiedJson) as Partial<AllowedState>

    this.ctx.update((s) => {
      if (s.localSettings.state === 'LOADED') {
        for (const [key, value] of Object.entries(toJson)) {
          // @ts-expect-error
          s.localSettings.value[key as keyof AllowedState] = value as any
        }
      }
    })

    return this.ctx._apis.localSettingsApi.setPreferences(toJson)
  }
}
