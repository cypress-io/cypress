import path from 'path'
import chokidar from 'chokidar'

import type { DataContext } from '..'
import type { FSWatcher } from 'fs'

export class DevActions {
  private _chokidar?: FSWatcher

  static get CY_STATE_PATH () {
    return path.join(__dirname, '../..', 'node_modules', '.cystate')
  }

  static get CY_TRIGGER_UPDATE () {
    return path.join(__dirname, '../..', 'node_modules', '.cystate-update')
  }

  constructor (private ctx: DataContext) {}

  watchForRelaunch () {
    // When we see changes to the .cystate file, we trigger a notification to the frontend
    if (!this._chokidar) {
      this._chokidar = chokidar.watch(DevActions.CY_STATE_PATH, {
        ignoreInitial: true,
      })

      this._chokidar.on('change', () => {
        this.ctx.coreData.dev.refreshState = new Date().toISOString()
        this.ctx.emitter.toApp()
        this.ctx.emitter.toLaunchpad()
      })
    }
  }

  triggerRelaunch () {
    return this.ctx.fs.writeFile(DevActions.CY_TRIGGER_UPDATE, JSON.stringify(new Date()))
  }

  dismissRelaunch () {
    this.ctx.coreData.dev.refreshState = null
  }

  dispose () {
    this._chokidar?.close()
    this._chokidar = undefined
  }
}
