import _ from 'lodash'
import { action, computed, observable } from 'mobx'

const defaults = {
  passed: 0,
  failed: 0,
  pending: 0,
  isPaused: false,
  isRunning: false,
  nextCommandName: null,

  _startTime: null,
  _currentTime: null,
}

class StatsStore {
  @observable passed = defaults.passed
  @observable failed = defaults.failed
  @observable pending = defaults.pending
  @observable isPaused = defaults.isPaused
  @observable isRunning = defaults.isRunning
  @observable nextCommandName = defaults.nextCommandName

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

    this._startTime = Date.now()
    this._updateCurrentTime()

    this._startTimer()
  }

  _startTimer () {
    this._interval = setInterval(action('duration:interval', this._updateCurrentTime.bind(this)), 100)
  }

  _stopTimer () {
    clearInterval(this._interval)
  }

  _updateCurrentTime () {
    this._currentTime = Date.now()
  }

  updateCount (type) {
    this[type] = this[type] + 1
  }

  pause (nextCommandName) {
    this._stopTimer()
    this.isPaused = true
    this.nextCommandName = nextCommandName
  }

  resume () {
    this.isPaused = false
    this.nextCommandName = null
    this._startTimer()
  }

  stop () {
    this._stopTimer()
    this._updateCurrentTime()
    this.isRunning = false
  }

  reset () {
    this._stopTimer()
    _.each(defaults, (value, key) => {
      this[key] = value
    })
  }
}

export default new StatsStore()
