import path from 'path'
import chokidar, { FSWatcher } from 'chokidar'

import type { DataContext } from '..'

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
        ignorePermissionErrors: true,
      })

      this._chokidar.on('change', () => {
        this.ctx.coreData.dev.refreshState = new Date().toISOString()
        this.ctx.emitter.devChange()
      })
    }
  }

  // In a setTimeout so that we flush the triggering response to the client before sending
  triggerRelaunch () {
    setTimeout(async () => {
      try {
        await this.ctx.destroy()
      } catch (e) {
        this.ctx.logTraceError(e)
      } finally {
        process.exitCode = 0
        await this.ctx.fs.writeFile(DevActions.CY_TRIGGER_UPDATE, JSON.stringify(new Date()))
      }
    }, 10)
  }

  dismissRelaunch () {
    this.ctx.coreData.dev.refreshState = null
  }

  dispose () {
    this._chokidar?.close().catch(() => {})
    this._chokidar = undefined
  }
}
