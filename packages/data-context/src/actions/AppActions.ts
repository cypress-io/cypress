import type { FoundBrowser } from '@packages/types'

import type { DataContext } from '..'

export interface AppApiShape {
  findNodePath(): Promise<string>
  appData: ApplicationDataApiShape
}

export interface ApplicationDataApiShape {
  path(): string
  toHashName(projectRoot: string): string
  ensure(): PromiseLike<unknown>
  remove(): PromiseLike<unknown>
}

export class AppActions {
  constructor (private ctx: DataContext) {}

  async setActiveBrowser (browser: FoundBrowser) {
    this.ctx.coreData.chosenBrowser = browser

    await this.ctx._apis.projectApi.insertProjectPreferencesToCache(this.ctx.lifecycleManager.projectTitle, {
      lastBrowser: {
        name: browser.name,
        channel: browser.channel,
      },
    })
  }

  async setActiveBrowserById (id: string) {
    const browserId = this.ctx.fromId(id, 'Browser')

    // Ensure that this is a valid ID to set
    const browser = this.ctx.lifecycleManager.browsers?.find((b) => this.idForBrowser(b as FoundBrowser) === browserId)

    if (browser) {
      return await this.setActiveBrowser(browser)
    }

    throw new Error('no browser in setActiveBrowserById')
  }

  async removeAppDataDir () {
    await this.ctx._apis.appApi.appData.remove()
  }

  async ensureAppDataDirExists () {
    await this.ctx._apis.appApi.appData.ensure()
  }

  private idForBrowser (obj: FoundBrowser) {
    return this.ctx.browser.idForBrowser(obj)
  }

  /**
   * Check whether we have a current chosen browser, and it matches up to one of the
   * ones we have selected
   */
  private hasValidChosenBrowser (browsers: FoundBrowser[]) {
    const chosenBrowser = this.ctx.coreData.chosenBrowser

    if (!chosenBrowser) {
      return false
    }

    return browsers.some((b) => this.idForBrowser(b) === this.idForBrowser(chosenBrowser))
  }
}
