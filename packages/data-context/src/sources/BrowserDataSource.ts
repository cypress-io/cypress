import type { FoundBrowser } from '@packages/types'
import type { DataContext } from '..'

export class BrowserDataSource {
  constructor (private ctx: DataContext) {}

  idForBrowser (obj: FoundBrowser) {
    return `${obj.name}-${obj.family}-${obj.channel}`
  }

  isSelected (obj: FoundBrowser) {
    const browser = this.ctx.currentProject?.currentBrowser

    if (!browser) {
      return false
    }

    return this.idForBrowser(browser) === this.idForBrowser(obj)
  }
}
