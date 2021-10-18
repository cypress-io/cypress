import { app, BrowserWindow } from 'electron'
import os from 'os'
import type { DataContext } from '..'

export class ElectronActions {
  constructor (private ctx: DataContext) { }

  private get electron () {
    return this.ctx.coreData.electron
  }

  private get isMac () {
    return os.platform() === 'darwin'
  }

  setBrowserWindow (window: BrowserWindow) {
    this.electron.browserWindow = window
  }

  hideBrowserWindow () {
    this.electron.browserWindow?.hide()

    if (this.isMac) {
      app.dock.hide()
    } else {
      this.electron.browserWindow?.setSkipTaskbar(true)
    }
  }

  showBrowserWindow () {
    this.electron.browserWindow?.show()

    if (this.isMac) {
      app.dock.show()
    } else {
      this.electron.browserWindow?.setSkipTaskbar(false)
    }
  }
}
