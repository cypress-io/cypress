import type { DataContext } from '..'

export class BrowserActions {
  constructor (private ctx: DataContext) {}

  get browserApi () {
    return this.ctx._apis.browserApi
  }

  closeBrowser () {
    return this.browserApi.close()
  }

  async focusActiveBrowserWindow () {
    await this.browserApi.focusActiveBrowserWindow()
  }
}
