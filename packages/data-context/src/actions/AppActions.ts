import type { FoundBrowser } from '@packages/types'
import type { DataContext } from '..'

export interface AppApiShape {
  getBrowsers(): Promise<FoundBrowser[]>
  ensureAndGetByNameOrPath(nameOrPath: string, browsers: ReadonlyArray<FoundBrowser>): Promise<FoundBrowser>
  findNodePath(): Promise<string>
}

export class AppActions {
  constructor (private ctx: DataContext) {}

  async loadMachineBrowsers (): Promise<FoundBrowser[]> {
    return this.ctx.loadingManager.machineBrowsers.load()
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
