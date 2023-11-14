import type { BrowserStatus } from '@packages/types'
import type { DataContext } from '..'

export interface AppApiShape {
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

  async removeAppDataDir () {
    await this.ctx._apis.appApi.appData.remove()
  }

  async ensureAppDataDirExists () {
    await this.ctx._apis.appApi.appData.ensure()
  }

  setBrowserStatus (browserStatus: BrowserStatus) {
    this.ctx.update((d) => {
      d.app.browserStatus = browserStatus

      // when we close the browser null out the user agent
      if (browserStatus === 'closed') {
        d.app.browserUserAgent = null
      }
    })

    this.ctx.emitter.browserStatusChange()
  }

  setBrowserUserAgent (userAgent?: string) {
    this.ctx.update((d) => {
      d.app.browserUserAgent = userAgent || null
    })
  }
}
