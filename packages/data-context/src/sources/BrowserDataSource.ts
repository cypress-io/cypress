import type { FoundBrowser } from '@packages/types'
import type { DataContext } from '..'

export class BrowserDataSource {
  constructor (private ctx: DataContext) {}

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
