import type { BrowserWindow } from 'electron'
import type { DataContext } from '..'

export interface ElectronApiShape {
  openExternal(url: string): void
}

export class ElectronActions {
  constructor (private ctx: DataContext) { }

  private get electron () {
    return this.ctx.coreData.electron
  }

  private get isMac () {
    return this.ctx.os === 'darwin'
  }

  setBrowserWindow (window: BrowserWindow) {
    this.electron.browserWindow = window
  }

  hideBrowserWindow () {
    this.electron.browserWindow?.hide()

    if (this.isMac) {
      this.ctx.electronApp?.dock.hide()
    } else {
      this.electron.browserWindow?.setSkipTaskbar(true)
    }
  }

  showBrowserWindow () {
    this.electron.browserWindow?.show()

    if (this.isMac) {
      this.ctx.electronApp?.dock.show()
    } else {
      this.electron.browserWindow?.setSkipTaskbar(false)
    }
  }

  showElectronOnAppExit () {
    this.refreshBrowserWindow()
    this.showBrowserWindow()
  }

  refreshBrowserWindow () {
    this.electron.browserWindow?.reload()
  }

  openExternal (url: string) {
    this.ctx.electronApi.openExternal(url)
  }
}
