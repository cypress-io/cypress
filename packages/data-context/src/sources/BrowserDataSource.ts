import type { FoundBrowser } from '@packages/types'
import type { DataContext } from '..'

export class BrowserDataSource {
  constructor (private ctx: DataContext) {}

  idForBrowser (obj: FoundBrowser) {
    return `${obj.name}-${obj.family}-${obj.channel}`
  }

  browserFromId (browserId: string) {
    const [, browserIdParts] = this.ctx.fromId(browserId)
    const [name, family, channel] = browserIdParts?.split('-') as string[]

    return this.ctx.browser
  }
}
