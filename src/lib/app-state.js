import _ from 'lodash'
import { observable } from 'mobx'

const defaults = {
  isPaused: false,
  isRunning: false,
  nextCommandName: null,
}

class AppState {
  @observable isPaused = defaults.isPaused
  @observable isRunning = defaults.isRunning
  @observable nextCommandName = defaults.nextCommandName

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
  }

  reset () {
    _.each(defaults, (value, key) => {
      this[key] = value
    })
  }
}

export { AppState }
export default new AppState()
