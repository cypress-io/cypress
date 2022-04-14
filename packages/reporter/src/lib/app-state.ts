import _ from 'lodash'
import { observable } from 'mobx'

interface DefaultAppState {
  isPaused: boolean
  isRunning: boolean
  isPreferencesMenuOpen: boolean
  nextCommandName: string | null | undefined
  pinnedSnapshotId: number | string | null
  studioActive: boolean
}

// these are used for the `reset` method
// so only a subset of the initial values are declared here
const defaults: DefaultAppState = {
  isPaused: false,
  isRunning: false,
  isPreferencesMenuOpen: false,
  nextCommandName: null,
  pinnedSnapshotId: null,
  studioActive: false,
}

class AppState {
  @observable autoScrollingEnabled = true
  @observable isSpecsListOpen = true
  @observable isPaused = defaults.isPaused
  @observable isRunning = defaults.isRunning
  @observable isPreferencesMenuOpen = defaults.isPreferencesMenuOpen
  @observable nextCommandName = defaults.nextCommandName
  @observable pinnedSnapshotId = defaults.pinnedSnapshotId
  @observable studioActive = defaults.studioActive

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

  temporarilySetAutoScrolling (isEnabled?: boolean | null) {
    if (isEnabled != null) {
      this.autoScrollingEnabled = isEnabled
    }
  }

  toggleAutoScrolling () {
    this.setAutoScrolling(!this.autoScrollingEnabled)
  }

  toggleSpecList () {
    this.isSpecsListOpen = !this.isSpecsListOpen
  }

  togglePreferencesMenu () {
    this.isPreferencesMenuOpen = !this.isPreferencesMenuOpen
  }

  setSpecsList (status: boolean) {
    this.isSpecsListOpen = status
  }

  setAutoScrolling (isEnabled?: boolean | null) {
    if (isEnabled != null) {
      this._resetAutoScrollingEnabledTo = isEnabled
      this.autoScrollingEnabled = isEnabled
    }
  }

  setStudioActive (studioActive: boolean) {
    this.studioActive = studioActive
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
