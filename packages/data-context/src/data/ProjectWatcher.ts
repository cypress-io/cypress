import chokidar from 'chokidar'

/**
 * Make the project watcher w/ Chokidar. Watches all files within a project
 * and triggers actions like
 */
export class ProjectWatcher {
  private _watcher?: chokidar.FSWatcher

  constructor () {
    this._watcher = chokidar.watch([], {})
  }

  init () {
    //
  }

  destroy () {
    return this._watcher?.close()
  }
}
