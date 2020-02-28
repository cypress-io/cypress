import _ from 'lodash'
import { observable } from 'mobx'

interface DefaultAppState {
  forcingGc: boolean
  firefoxGcInterval: number | null | undefined
  isPaused: boolean
  isRunning: boolean
  nextCommandName: string | null | undefined
  pinnedSnapshotId: number | string | null
}

const defaults: DefaultAppState = {
  forcingGc: false,
  firefoxGcInterval: undefined,
  isPaused: false,
  isRunning: false,
  nextCommandName: null,
  pinnedSnapshotId: null,
}

class AppState {
  @observable autoScrollingEnabled = true
  @observable forcingGc = defaults.forcingGc
  @observable isPaused = defaults.isPaused
  @observable isRunning = defaults.isRunning
  @observable nextCommandName = defaults.nextCommandName
  @observable pinnedSnapshotId = defaults.pinnedSnapshotId
  @observable firefoxGcInterval = defaults.firefoxGcInterval

  isStopped = false;
  _resetAutoScrollingEnabledTo = true;
  [key: string]: any

  startRunning () {
    this.isRunning = true
    this.isStopped = false
  }

  pause (nextCommandName?: string) {
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

  setForcingGc (forcingGc: boolean) {
    this.forcingGc = forcingGc
  }

  setFirefoxGcInterval (firefoxGcInterval: DefaultAppState['firefoxGcInterval']) {
    this.firefoxGcInterval = firefoxGcInterval
  }

  temporarilySetAutoScrolling (isEnabled?: boolean | null) {
    if (isEnabled != null) {
      this.autoScrollingEnabled = isEnabled
    }
  }

  toggleAutoScrolling () {
    this.setAutoScrolling(!this.autoScrollingEnabled)
  }

  setAutoScrolling (isEnabled?: boolean | null) {
    if (isEnabled != null) {
      this._resetAutoScrollingEnabledTo = isEnabled
      this.autoScrollingEnabled = isEnabled
    }
  }

  reset () {
    _.each(defaults, (value: any, key: string) => {
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
