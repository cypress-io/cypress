import type { FoundBrowser } from '@packages/types'
import pDefer from 'p-defer'

import type { DataContext } from '..'

export interface AppApiShape {
  getBrowsers(): Promise<FoundBrowser[]>
  ensureAndGetByNameOrPath(nameOrPath: string, browsers: ReadonlyArray<FoundBrowser>): Promise<FoundBrowser>
}

export class AppActions {
  constructor (private ctx: DataContext) {}

  async loadMachineBrowsers (): Promise<FoundBrowser[]> {
    if (this.ctx.coreData.app.loadingMachineBrowsers) {
      return this.ctx.coreData.app.loadingMachineBrowsers
    }

    const dfd = pDefer<FoundBrowser[]>()

    this.ctx.coreData.app.loadingMachineBrowsers = dfd.promise

    this.ctx.debug('loadMachineBrowsers')
    try {
      const browsers = await this.ctx._apis.appApi.getBrowsers()

      this.ctx.coreData.app.machineBrowsers = browsers

      this.ctx.debug('loadMachineBrowsers: %o', browsers)
      dfd.resolve(browsers)
    } catch (e) {
      this.ctx.debug('loadMachineBrowsers error %o', e)
      this.ctx.coreData.globalError = this.ctx.prepError(e as Error)
      dfd.resolve([])
    } finally {
      this.ctx.coreData.app.loadingMachineBrowsers = null
    }

    return dfd.promise
  }

  private idForBrowser (obj: FoundBrowser) {
    return this.ctx.browser.idForBrowser(obj)
  }

  /**
   * Check whether we have a current chosen browser, and it matches up to one of the
   * ones we have selected
   */
  private hasValidCurrentBrowser (browsers: FoundBrowser[]) {
    const chosenBrowser = this.ctx.coreData.currentProject?.currentBrowser

    if (!chosenBrowser) {
      return false
    }

    return browsers.some((b) => this.idForBrowser(b) === this.idForBrowser(chosenBrowser))
  }
}
