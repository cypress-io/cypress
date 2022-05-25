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

  async setActiveBrowserById (id: string) {
    const browserId = this.ctx.fromId(id, 'Browser')
    const browser = this.ctx.lifecycleManager.browsers?.find((b) => this.ctx.browser.idForBrowser(b as FoundBrowser) === browserId)

    if (!browser) {
      throw new Error('no browser in setActiveBrowserById')
    }

    await this.setActiveBrowser(browser)
  }

  async setActiveBrowser (browser: FoundBrowser) {
    this.ctx.update((d) => {
      d.activeBrowser = browser
      if (d.currentProjectData?.testingTypeData?.activeAppData) {
        d.currentProjectData.testingTypeData.activeAppData = { error: null, warnings: [] }
      }
    })

    try {
      await this.ctx._apis.projectApi.insertProjectPreferencesToCache(this.ctx.lifecycleManager.projectTitle, {
        lastBrowser: {
          name: browser.name,
          channel: browser.channel,
        },
      })
    } catch (e) {
      this.ctx.logTraceError(e)
    }
  }

  async focusActiveBrowserWindow () {
    await this.browserApi.focusActiveBrowserWindow()
  }

  async relaunchBrowser () {
    await this.browserApi.relaunchBrowser()
  }
}
