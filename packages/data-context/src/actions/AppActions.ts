import type { FoundBrowser } from '@packages/types'
import type { DataContext } from '..'

export interface AppApiShape {
  getBrowsers(): Promise<FoundBrowser[]>
}

export class AppActions {
  constructor (private ctx: DataContext) {}

  async setActiveBrowser (id: string) {
    const browserId = this.ctx.fromId(id, 'Browser')
    const browser = this.ctx.appData.browsers?.find((b) => this.ctx.browser.idForBrowser(b) === browserId)

    // Ensure that this is a valid ID to set
    if (browser) {
      this.ctx.coreData.wizard.chosenBrowser = browser
    }
  }

  async refreshBrowsers () {
    const browsers = await this.ctx._apis.appApi.getBrowsers()

    this.ctx.coreData.app.browsers = browsers
  }
}
