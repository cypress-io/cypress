import type { CypressError, CypressErrorIdentifier, CypressErrorLike, FoundBrowser } from '@packages/types'
import type { Immutable } from 'immer'
import type { DataContext } from '..'

export interface AppApiShape {
  warn(type: CypressErrorIdentifier, ...args: any[]): void
  error(type: CypressErrorIdentifier, ...args: any[]): CypressError | CypressErrorLike
  errorString(type: CypressErrorIdentifier, ...args: any[]): string
  getBrowsers(): Promise<FoundBrowser[]>
  ensureAndGetByNameOrPath(nameOrPath: string, browsers: ReadonlyArray<FoundBrowser>): Promise<FoundBrowser>
}

export class AppActions {
  constructor (private ctx: DataContext) {}

  async loadMachineBrowsers (): Promise<Immutable<FoundBrowser[]> | undefined> {
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
