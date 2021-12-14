import type Bluebird from 'bluebird'
import type { FoundBrowser } from '@packages/types'

import type { DataContext } from '..'

export interface AppApiShape {
  getBrowsers(): Promise<FoundBrowser[]>
  ensureAndGetByNameOrPath(nameOrPath: string, returnAll?: boolean, browsers?: FoundBrowser[]): Bluebird<FoundBrowser | FoundBrowser[] | undefined>
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

  setActiveBrowser (browser: FoundBrowser) {
    this.ctx.coreData.chosenBrowser = browser
  }

  setActiveBrowserById (id: string) {
    const browserId = this.ctx.fromId(id, 'Browser')

    // Ensure that this is a valid ID to set
    const browser = this.ctx.lifecycleManager.browsers?.find((b) => this.idForBrowser(b as FoundBrowser) === browserId)

    if (browser) {
      this.setActiveBrowser(browser)
    }
  }

  async removeAppDataDir () {
    await this.ctx._apis.appApi.appData.remove()
  }

  async ensureAppDataDirExists () {
    await this.ctx._apis.appApi.appData.ensure()
  }

  async setActiveBrowserByNameOrPath (browserNameOrPath: string) {
    let browser

    try {
      browser = (await this.ctx._apis.appApi.ensureAndGetByNameOrPath(browserNameOrPath)) as FoundBrowser | undefined
    } catch (err: unknown?) {
      this.ctx.debug('Error getting browser by name or path (%s): %s', browserNameOrPath, err?.stack || err)
      const message = err.details ? `${err.message}\n\n\`\`\`\n${err.details}\n\`\`\`` : err.message

      this.ctx.coreData.wizard.warnings.push({
        title: 'Warning: Browser Not Found',
        message,
        setupStep: 'setupComplete',
      })
    }

    if (browser) {
      this.setActiveBrowser(browser)
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
    const chosenBrowser = this.ctx.coreData.chosenBrowser

    if (!chosenBrowser) {
      return false
    }

    return browsers.some((b) => this.idForBrowser(b) === this.idForBrowser(chosenBrowser))
  }
}
