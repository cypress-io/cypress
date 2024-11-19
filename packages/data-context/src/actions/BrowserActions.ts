import type { FoundBrowser } from '@packages/types'
import type { DataContext } from '..'

export class BrowserActions {
  constructor (private ctx: DataContext) {}

  get browserApi () {
    return this.ctx._apis.browserApi
  }

  closeBrowser () {
    return this.browserApi.close()
  }

  setActiveBrowserById (id: string) {
    const browserId = this.ctx.fromId(id, 'Browser')
    const browser = this.ctx.lifecycleManager.browsers?.find((b) => this.ctx.browser.idForBrowser(b as FoundBrowser) === browserId)

    if (!browser) {
      throw new Error('no browser in setActiveBrowserById')
    }

    this.setActiveBrowser(browser)
  }

  setActiveBrowser (browser: FoundBrowser) {
    if (this.ctx.coreData.activeBrowser === browser) {
      return
    }

    this.ctx.update((d) => {
      d.activeBrowser = browser
    })

    this.ctx._apis.projectApi.insertProjectPreferencesToCache(this.ctx.lifecycleManager.projectTitle, {
      lastBrowser: {
        name: browser.name,
        channel: browser.channel,
      },
    })
  }

  setCliBrowser (browser: string) {
    this.ctx.updateModeOptionsBrowser(browser)
    this.ctx.coreData.cliBrowser = browser
  }

  async focusActiveBrowserWindow () {
    await this.browserApi.focusActiveBrowserWindow()
  }

  async relaunchBrowser () {
    await this.browserApi.relaunchBrowser()
  }
}
