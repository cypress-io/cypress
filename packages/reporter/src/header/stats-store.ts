import _ from 'lodash'
import { action, computed, observable } from 'mobx'

export interface IStatsStore {
  numPassed: number
  numFailed: number
  numPending: number

  _startTime: number | null
  _currentTime: number | null
  [key: string]: any
}

const defaults: IStatsStore = {
  numPassed: 0,
  numFailed: 0,
  numPending: 0,

  _startTime: null,
  _currentTime: null,
}

class StatsStore implements IStatsStore {
  @observable numPassed = defaults.numPassed
  @observable numFailed = defaults.numFailed
  @observable numPending = defaults.numPending

  @observable _startTime = defaults._startTime
  @observable _currentTime = defaults._startTime;
  [key: string]: any

  private _interval: NodeJS.Timeout | undefined;

  @computed get duration () {
    if (!this._startTime) return 0

    if (!this._currentTime) {
      throw new Error('StatsStore should be initialized with start() method.')
    }

    return this._currentTime - this._startTime
  }

  start ({ startTime, numPassed = 0, numFailed = 0, numPending = 0 }: {
    startTime: string
    numPassed?: number
    numFailed?: number
    numPending?: number
  }) {
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
    clearInterval(this._interval as NodeJS.Timeout)
  }

  _updateCurrentTime () {
    this._currentTime = Date.now()
  }

  incrementCount (type: string) {
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
