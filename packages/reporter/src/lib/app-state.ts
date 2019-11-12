import _ from 'lodash'
import { observable } from 'mobx'

interface DefaultAppState {
  isPaused: boolean;
  isRunning: boolean;
  nextCommandName: string | null | undefined;
  pinnedSnapshotId: any;
}

const defaults: DefaultAppState = {
  isPaused: false,
  isRunning: false,
  nextCommandName: null,
  pinnedSnapshotId: null,
}

export interface IAppState extends DefaultAppState {
  autoScrollingEnabled: boolean;
  [key: string]: any;
}

class AppState implements IAppState {
  @observable autoScrollingEnabled = true
  @observable isPaused = defaults.isPaused
  @observable isRunning = defaults.isRunning
  @observable nextCommandName = defaults.nextCommandName
  @observable pinnedSnapshotId = defaults.pinnedSnapshotId

  isStopped = false;
  _resetAutoScrollingEnabledTo = true;

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

  setAutoScrolling (isEnabled?: boolean | null) {
    if (isEnabled != null) {
      this._resetAutoScrollingEnabledTo = isEnabled
      this.autoScrollingEnabled = isEnabled
    }
  }

  reset () {
    // this[key] causes index signature error. That's why this var is created.
    const state: IAppState = this

    _.each(defaults, (value: any, key: string) => {
      state[key] = value
    })

    this._resetAutoScrolling()
  }

  _resetAutoScrolling () {
    this.autoScrollingEnabled = this._resetAutoScrollingEnabledTo
  }
}

export { AppState }

export default new AppState()
