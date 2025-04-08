import _ from 'lodash'
import { observable, makeObservable } from 'mobx'

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
  @observable autoScrollingUserPref = true
  @observable autoScrollingEnabled = true
  @observable isSpecsListOpen = false
  @observable isPaused = defaults.isPaused
  @observable isRunning = defaults.isRunning
  @observable isPreferencesMenuOpen = defaults.isPreferencesMenuOpen
  @observable nextCommandName = defaults.nextCommandName
  @observable pinnedSnapshotId = defaults.pinnedSnapshotId
  @observable studioActive = defaults.studioActive

  isStopped = false
  _resetAutoScrollingEnabledTo = true;
  [key: string]: any

  constructor () {
    makeObservable(this)
  }

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

  /**
   * Toggles the auto-scrolling user preference to true|false. This method should only be called from the
   * preferences menu itself.
   */
  toggleAutoScrollingUserPref () {
    this.setAutoScrollingUserPref(!this.autoScrollingUserPref)
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

  /**
   * Sets the auto scroll user preference to true|false.
   * When this preference is set, it overrides any temporary auto scrolling behaviors that may be in effect.
   * @param {boolean | null | undefined} isEnabled - whether or not auto scroll should be enabled or disabled.
   * If not a boolean, this method is a no-op.
   */
  setAutoScrollingUserPref (isEnabled?: boolean | null) {
    if (isEnabled != null) {
      this.autoScrollingUserPref = isEnabled
      this.setAutoScrolling(isEnabled)
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
