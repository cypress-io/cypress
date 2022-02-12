import os from 'os'
import type { DataContext } from '..'
import _ from 'lodash'
import path from 'path'
import assert from 'assert'
import type electron from 'electron'
import type { BrowserWindow, OpenDialogOptions, SaveDialogOptions } from 'electron'

export type ElectronApiShape = typeof electron | undefined

export interface OpenExternalOptions {
  url: string
  params: { [key: string]: string }
}

export class ElectronActions {
  constructor (private ctx: DataContext) { }

  private get browserWindow () {
    return this.ctx.coreData.electronWindow
  }

  private get shell () {
    return this.electron?.shell
  }

  get electron () {
    return this.ctx._apis.electronApi
  }

  private get isMac () {
    return os.platform() === 'darwin'
  }

  copyToClipboard (text: string) {
    this.electron?.clipboard?.writeText(text)
  }

  setBrowserWindow (window: BrowserWindow) {
    this.ctx.update((o) => {
      o.electronWindow = window
    })
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
    this.browserWindow?.show()

    if (this.isMac) {
      this.ctx.electronApp?.dock.show().catch((e) => {
        this.ctx.logTraceError(e)
      })
    } else {
      this.browserWindow?.setSkipTaskbar(false)
    }
  }

  showElectronOnAppExit () {
    this.refreshBrowserWindow()
    this.showBrowserWindow()
  }

  refreshBrowserWindow () {
    this.browserWindow?.reload()
  }

  openExternal (opts: OpenExternalOptions | string) {
    if (_.isString(opts)) {
      return this.shell?.openExternal(opts)
    }

    const url = new URL(opts.url)

    if (opts.params) {
      // just add the utm_source here so we don't have to duplicate it on every link
      if (_.find(opts.params, (_val, key) => _.includes(key, 'utm_'))) {
        opts.params.utm_source = 'Test Runner'
      }

      url.search = new URLSearchParams(opts.params).toString()
    }

    return this.shell?.openExternal(url.href)
  }

  showItemInFolder (url: string) {
    this.shell?.showItemInFolder(url)
  }

  showOpenDialog () {
    const props: OpenDialogOptions = {
      // we only want the user to select a single
      // directory. not multiple, and not files
      properties: ['openDirectory'],
    }

    return this.ctx.electronApi?.dialog.showOpenDialog(props)
    .then((obj) => {
      // return the first path since there can only ever
      // be a single directory selection
      return _.get(obj, ['filePaths', 0])
    })
  }

  showSaveDialog (integrationFolder: string) {
    // Do we want to attach browserWindow (?)
    assert(this.browserWindow, 'Browser window is not set')

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
    return this.ctx.electronApi?.dialog.showSaveDialog(this.browserWindow, props).then((obj) => {
      return obj.filePath || null
    })
  }
}
