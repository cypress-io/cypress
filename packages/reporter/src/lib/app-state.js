import _ from 'lodash'
import { observable } from 'mobx'

const defaults = {
  isPaused: false,
  isRunning: false,
  nextCommandName: null,
  pinnedSnapshotId: null,
}

class AppState {
  @observable autoScrollingEnabled = true
  @observable isPaused = defaults.isPaused
  @observable isRunning = defaults.isRunning
  @observable nextCommandName = defaults.nextCommandName
  @observable pinnedSnapshotId = defaults.pinnedSnapshotId

  isStopped = false
  _resetAutoScrollingEnabledTo = true

  startRunning () {
    this.isRunning = true
    this.isStopped = false
  }

  pause (nextCommandName) {
    this.isPaused = true
    this.nextCommandName = nextCommandName
  }

  resume () {
    this.isPaused = false
    this.nextCommandName = null
  }

  stop () {
    this.isStopped = true
  }

  end () {
    this.isRunning = false
    this._resetAutoScrolling()
  }

  temporarilySetAutoScrolling (isEnabled) {
    if (isEnabled != null) {
      this.autoScrollingEnabled = isEnabled
    }
  }

  toggleAutoScrolling () {
    this.setAutoScrolling(!this.autoScrollingEnabled)
  }

  setAutoScrolling (isEnabled) {
    if (isEnabled != null) {
      this._resetAutoScrollingEnabledTo = isEnabled
      this.autoScrollingEnabled = isEnabled
    }
  }

  reset () {
    _.each(defaults, (value, key) => {
      this[key] = value
    })

    this._resetAutoScrolling()
  }

  _resetAutoScrolling () {
    this.autoScrollingEnabled = this._resetAutoScrollingEnabledTo
  }
}

export { AppState }

export default new AppState()
