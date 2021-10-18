import type { BrowserWindow } from 'electron'
import type { DataContext } from '..'

export class ElectronActions {
  constructor (private ctx: DataContext) { }

  private get electron () {
    return this.ctx.coreData.electron
  }

  setBrowserWindow (window: BrowserWindow) {
    this.electron.browserWindow = window
  }

  hideBrowserWindow () {
    this.electron.browserWindow?.hide()
    // this.electron.browserWindow?.setIcon(nativeImage.createEmpty())
  }

  showBrowserWindow () {
    this.electron.browserWindow?.show()
  }
}
