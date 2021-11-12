import type { FoundBrowser } from '@packages/types'
import pDefer from 'p-defer'

import type { DataContext } from '..'

export interface AppApiShape {
  getBrowsers(): Promise<FoundBrowser[]>
  ensureAndGetByNameOrPath(nameOrPath: string, browsers: ReadonlyArray<FoundBrowser>): Promise<FoundBrowser | undefined>
}

export class AppActions {
  constructor (private ctx: DataContext) {}

  async refreshBrowsers (): Promise<FoundBrowser[]> {
    if (this.ctx.coreData.app.refreshingBrowsers) {
      return this.ctx.coreData.app.refreshingBrowsers
    }

    const dfd = pDefer<FoundBrowser[]>()

    this.ctx.coreData.app.refreshingBrowsers = dfd.promise

    // TODO(tim): global unhandled error concept
    const browsers = await this.ctx._apis.appApi.getBrowsers()

    this.ctx.coreData.app.browsers = browsers

    if (this.ctx.coreData.currentProject) {
      this.ctx.coreData.currentProject.browsers = browsers
    }

    dfd.resolve(browsers)

    return dfd.promise
  }

  private idForBrowser (obj: FoundBrowser) {
    return this.ctx.browser.idForBrowser(obj)
  }

  /**
   * Check whether we have a current chosen browser, and it matches up to one of the
   * ones we have selected
   */
  private hasValidChosenBrowser (browsers: FoundBrowser[]) {
    const chosenBrowser = this.ctx.coreData.currentProject?.chosenBrowser

    if (!chosenBrowser) {
      return false
    }

    return browsers.some((b) => this.idForBrowser(b) === this.idForBrowser(chosenBrowser))
  }
}
