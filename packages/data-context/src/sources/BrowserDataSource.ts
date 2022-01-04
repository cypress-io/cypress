import type { FoundBrowser } from '@packages/types'
import type { DataContext } from '..'

export interface BrowserApiShape {
  close(): Promise<any>
  ensureAndGetByNameOrPath(nameOrPath: string): Promise<FoundBrowser | undefined>
  getBrowsers(): Promise<FoundBrowser[]>
}

export class BrowserDataSource {
  constructor (private ctx: DataContext) {}

  /**
   * Gets the browsers from the machine, caching the Promise on the coreData
   * so we only look them up once
   */
  machineBrowsers () {
    if (!this.ctx.coreData.machineBrowsers) {
      const p = this.ctx._apis.browserApi.getBrowsers()

      this.ctx.coreData.machineBrowsers = p
      p.then((browsers) => {
        if (this.ctx.coreData.machineBrowsers === p) {
          if (browsers[0]) {
            this.ctx.coreData.chosenBrowser = browsers[0]
          }

          this.ctx.coreData.machineBrowsers = browsers
        }
      }).catch((e) => {
        this.ctx.coreData.machineBrowsers = null
        this.ctx.coreData.baseError = e
        throw e
      })
    }

    return this.ctx.coreData.machineBrowsers
  }

  idForBrowser (obj: FoundBrowser) {
    return `${obj.name}-${obj.family}-${obj.channel}`
  }

  isSelected (obj: FoundBrowser) {
    if (!this.ctx.coreData.chosenBrowser) {
      return false
    }

    return this.idForBrowser(this.ctx.coreData.chosenBrowser) === this.idForBrowser(obj)
  }
}
