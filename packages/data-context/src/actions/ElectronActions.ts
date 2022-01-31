import type { App, BrowserWindow, OpenDialogOptions, OpenDialogReturnValue, SaveDialogOptions, SaveDialogReturnValue } from 'electron'
import os from 'os'
import type { DataContext } from '..'
import _ from 'lodash'
import path from 'path'
import assert from 'assert'

export interface ElectronApiShape {
  openExternal(url: string): void
  showItemInFolder(folder: string): void
  showOpenDialog(props: OpenDialogOptions): Promise<OpenDialogReturnValue>
  showSaveDialog(window: BrowserWindow, props: SaveDialogOptions): Promise<SaveDialogReturnValue>
}

export class ElectronActions {
  constructor (private ctx: DataContext) { }

  private get electron () {
    return this.ctx.coreData.electron
  }

  private get isMac () {
    return os.platform() === 'darwin'
  }

  setElectronApp (app: App) {
    this.electron.app = app
  }

  setBrowserWindow (window: BrowserWindow) {
    this.electron.browserWindow = window
  }

  hideBrowserWindow () {
    // this.electron.browserWindow?.hide()
    // if (this.isMac) {
    //   this.ctx.electronApp?.dock.hide()
    // } else {
    //   this.electron.browserWindow?.setSkipTaskbar(true)
    // }
  }

  showBrowserWindow () {
    this.electron.browserWindow?.show()

    if (this.isMac) {
      this.ctx.electronApp?.dock.show().catch((e) => {
        this.ctx.logTraceError(e)
      })
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

  showOpenDialog () {
    const props: OpenDialogOptions = {
      // we only want the user to select a single
      // directory. not multiple, and not files
      properties: ['openDirectory'],
    }

    return this.ctx.electronApi.showOpenDialog(props)
    .then((obj) => {
      // return the first path since there can only ever
      // be a single directory selection
      return _.get(obj, ['filePaths', 0])
    })
  }

  showSaveDialog (integrationFolder: string) {
    // Do we want to attach browserWindow (?)
    assert(this.electron.browserWindow, 'Browser window is not set')

    const props: SaveDialogOptions = {
      defaultPath: path.join(integrationFolder, 'untitled.spec.js'),
      buttonLabel: 'Create File',
      showsTagField: false,
      filters: [{
        name: 'JavaScript',
        extensions: ['js'],
      }, {
        name: 'TypeScript',
        extensions: ['ts'],
      }, {
        name: 'Other',
        extensions: ['*'],
      }],
      properties: ['createDirectory', 'showOverwriteConfirmation'],
    }

    // attach to window so it displays as a modal rather than a standalone window
    return this.ctx.electronApi.showSaveDialog(this.electron.browserWindow, props).then((obj) => {
      return obj.filePath || null
    })
  }
}
