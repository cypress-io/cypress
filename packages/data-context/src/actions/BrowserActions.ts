import type { DataContext } from '..'

export interface BrowserApiShape {
  //
}

export class BrowserActions {
  constructor (private ctx: DataContext) {}

  closeBrowser () {
    this.ctx._apis.browserApi
  }

  reloadBrowser (location: string, browserName?: string) {
    //
  }
}
