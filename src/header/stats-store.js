import _ from 'lodash'
import { computed, observable } from 'mobx'

const defaults = {
  passed: 0,
  failed: 0,
  pending: 0,
  isRunning: false,

  _startTime: null,
  _currentTime: null,
}

class StatsStore {
  @observable passed = defaults.passed
  @observable failed = defaults.failed
  @observable pending = defaults.pending
  @observable isRunning = defaults.isRunning

  @observable _startTime = defaults._startTime
  @observable _currentTime = defaults._startTime

  @computed get duration () {
    if (!this._startTime) return 0

    return this._currentTime - this._startTime
  }

  startRunning () {
    this.isRunning = true
  }

  startCounting () {
    if (this._startTime) return

    // TODO: use this if it can be smooth
    // this._interval = setInterval(() => {
    //   this._currentTime = Date.now()
    // }, 16)

    this._startTime = Date.now()
    this._currentTime = Date.now()
  }

  updateTime () {
    this._currentTime = Date.now()
  }

  updateCount (type) {
    this[type] = this[type] + 1
  }

  stop () {
    this.updateTime()
    this.isRunning = false
  }

  reset () {
    _.each(defaults, (value, key) => {
      this[key] = value
    })
  }
}

export default new StatsStore()
