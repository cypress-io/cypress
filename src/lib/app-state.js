import _ from 'lodash'
import { observable } from 'mobx'

const defaults = {
  isPaused: false,
  isRunning: false,
  nextCommandName: null,
}

class AppState {
  @observable autoScrollingEnabled = true
  @observable isPaused = defaults.isPaused
  @observable isRunning = defaults.isRunning
  @observable nextCommandName = defaults.nextCommandName

  _resetAutoScrollingEnabledTo = true

  startRunning () {
    this.isRunning = true
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
    this.isRunning = false
    this._resetAutoScrolling()
  }

  setAutoScrolling (isEnabled) {
    if (isEnabled != null) {
      this.autoScrollingEnabled = isEnabled
    }
  }

  toggleAutoScrolling () {
    this._resetAutoScrollingEnabledTo = !this.autoScrollingEnabled
    this.autoScrollingEnabled = !this.autoScrollingEnabled
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
