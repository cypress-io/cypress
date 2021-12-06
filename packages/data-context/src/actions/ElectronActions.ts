import type { App, BrowserWindow } from 'electron'
import type { DataContext } from '..'

export interface ElectronApiShape {
  openExternal(url: string): void
  showItemInFolder(folder: string): void
}

export class ElectronActions {
  constructor (private ctx: DataContext) { }

  private get electron () {
    return this.ctx.coreData.electron
  }

  private get isMac () {
    return this.ctx.os === 'darwin'
  }

  //
  focusLaunchpad () {
    // return this.ctx.app.focus({ steal: true }) || this.ctx.win.focus()
  }

  setElectronApp (app: App) {
    this.ctx.update((s) => {
      s.electron.app = app
    })
  }

  setBrowserWindow (window: BrowserWindow) {
    this.ctx.update((s) => {
      s.electron.browserWindow = window
    })
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

  showItemInFolder (url: string) {
    this.ctx.electronApi.showItemInFolder(url)
  }
}
