import type Bluebird from 'bluebird'
import type { FoundBrowser } from '@packages/types'
import pDefer from 'p-defer'

import type { DataContext } from '..'

export interface AppApiShape {
  getBrowsers(): Promise<FoundBrowser[]>
  ensureAndGetByNameOrPath(nameOrPath: string, returnAll?: boolean, browsers?: FoundBrowser[]): Bluebird<FoundBrowser | FoundBrowser[] | undefined>
  findNodePath(): Promise<string>
}

export class AppActions {
  constructor (private ctx: DataContext) {}

  setActiveBrowser (browser: FoundBrowser) {
    this.ctx.coreData.wizard.chosenBrowser = browser
  }

  setActiveBrowserById (id: string) {
    const browserId = this.ctx.fromId(id, 'Browser')

    // Ensure that this is a valid ID to set
    const browser = this.ctx.appData.browsers?.find((b) => this.idForBrowser(b) === browserId)

    if (browser) {
      this.setActiveBrowser(browser)
    }
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

  async refreshBrowsers () {
    if (this.ctx.coreData.app.refreshingBrowsers) {
      return
    }

    const dfd = pDefer<FoundBrowser[]>()

    this.ctx.coreData.app.refreshingBrowsers = dfd.promise

    // TODO(tim): global unhandled error concept
    const browsers = await this.ctx._apis.appApi.getBrowsers()

    this.ctx.coreData.app.browsers = browsers

    if (this.ctx.coreData.currentProject) {
      this.ctx.coreData.currentProject.browsers = browsers
    }

    // If we don't have a chosen browser, assign to the first one in the list
    if (!this.hasValidChosenBrowser(browsers) && browsers[0]) {
      this.ctx.coreData.wizard.chosenBrowser = browsers[0]
    }

    dfd.resolve(browsers)
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

  async refreshNodePath () {
    if (this.ctx.coreData.app.refreshingNodePath) {
      return
    }

    const dfd = pDefer<string>()

    this.ctx.coreData.app.refreshingNodePath = dfd.promise

    const nodePath = await this.ctx._apis.appApi.findNodePath()

    this.ctx.coreData.app.nodePath = nodePath

    dfd.resolve(nodePath)
  }
}
