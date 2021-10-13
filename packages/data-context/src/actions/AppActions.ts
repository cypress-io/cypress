import type Bluebird from 'bluebird'
import type { FoundBrowser } from '@packages/types'
import type { DataContext } from '..'

export interface AppApiShape {
  getBrowsers(): Promise<FoundBrowser[]>
  ensureAndGetByNameOrPath(nameOrPath: string, returnAll?: boolean, browsers?: FoundBrowser[]): Bluebird<FoundBrowser | FoundBrowser[] | undefined>
}

export class AppActions {
  constructor (private ctx: DataContext) {}

  setActiveBrowser (browser?: FoundBrowser) {
    if (browser) {
      this.ctx.coreData.wizard.chosenBrowser = browser
    }
  }

  setActiveBrowserById (id: string) {
    const browserId = this.ctx.fromId(id, 'Browser')

    // Ensure that this is a valid ID to set
    const browser = this.ctx.appData.browsers?.find((b) => this.idForBrowser(b) === browserId)

    this.setActiveBrowser(browser)
  }

  async setActiveBrowserByNameOrPath (browserNameOrPath: string) {
    const browser = (await this.ctx._apis.appApi.ensureAndGetByNameOrPath(browserNameOrPath)) as FoundBrowser | undefined

    this.setActiveBrowser(browser)
  }

  async refreshBrowsers () {
    const browsers = await this.ctx._apis.appApi.getBrowsers()

    this.ctx.coreData.app.browsers = browsers

    // If we don't have a chosen browser, assign to the first one in the list
    if (!this.hasValidChosenBrowser(browsers) && browsers[0]) {
      this.ctx.coreData.wizard.chosenBrowser = browsers[0]
    }
  }

  private idForBrowser (obj: FoundBrowser) {
    return this.ctx.browser.idForBrowser(obj)
  }

  /**
   * Check whether we have a current chosen browser, and it matches up to one of the
   * ones we have selected
   */
  private hasValidChosenBrowser (browsers: FoundBrowser[]) {
    const chosenBrowser = this.ctx.coreData.wizard.chosenBrowser

    if (!chosenBrowser) {
      return false
    }

    return browsers.some((b) => this.idForBrowser(b) === this.idForBrowser(chosenBrowser))
  }
}
