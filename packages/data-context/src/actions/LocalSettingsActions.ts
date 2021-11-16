import type { AvailableEditor, Editor } from '@packages/types'
import pDefer from 'p-defer'

import type { DataContext } from '..'

export interface LocalSettingsApiShape {
  setPreferredOpener(editor: Editor): Promise<void>
  getAvailableEditors(): Promise<AvailableEditor[]>
}

export class LocalSettingsActions {
  constructor (private ctx: DataContext) {}

  async refreshLocalSettings () {
    if (this.ctx.coreData.localSettings?.refreshing) {
      return
    }

    const dfd = pDefer<AvailableEditor[]>()

    this.ctx.coreData.localSettings.refreshing = dfd.promise

    // TODO(tim): global unhandled error concept
    const availableEditors = await this.ctx._apis.localSettingsApi.getAvailableEditors()

    this.ctx.coreData.localSettings.availableEditors = availableEditors

    dfd.resolve(availableEditors)
  }

  async setPreferredEditorBinary (binary: string) {
    const preferred = this.ctx.coreData.localSettings.availableEditors.find((x) => x.binary === binary)

    if (!preferred) {
      return
    }

    // cache to local settings for future
    await this.ctx._apis.localSettingsApi.setPreferredOpener(preferred)

    // update local ctx state as well, so we do not need to re-query file system
    this.ctx.coreData.localSettings.availableEditors = this.ctx.coreData.localSettings.availableEditors.map((x) => {
      return {
        ...x,
        isPreferred: x.binary === binary,
      }
    })
  }
}
