import _ from 'lodash'
import { action, computed, observable } from 'mobx'

const defaults = {
  numPassed: 0,
  numFailed: 0,
  numPending: 0,

  _startTime: null,
  _currentTime: null,
}

class StatsStore {
  @observable numPassed = defaults.numPassed
  @observable numFailed = defaults.numFailed
  @observable numPending = defaults.numPending

  @observable _startTime = defaults._startTime
  @observable _currentTime = defaults._startTime

  @computed get duration () {
    if (!this._startTime) return 0

    return this._currentTime - this._startTime
  }

  start ({ startTime, numPassed = 0, numFailed = 0, numPending = 0 }) {
    if (this._startTime) return

    this.numPassed = numPassed
    this.numFailed = numFailed
    this.numPending = numPending

    this._startTime = new Date(startTime).getTime()
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

  @action
  incrementCount (type) {
    const countKey = `num${_.capitalize(type)}`

    this[countKey] = this[countKey] + 1
  }

  pause () {
    this._stopTimer()
  }

  resume () {
    this._startTimer()
  }

  end () {
    this._stopTimer()
    this._updateCurrentTime()
  }

  reset () {
    this._stopTimer()
    _.each(defaults, (value, key) => {
      this[key] = value
    })
  }
}

export { StatsStore }

export default new StatsStore()
