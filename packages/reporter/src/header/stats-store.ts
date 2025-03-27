import _ from 'lodash'
import { action, computed, observable, makeObservable } from 'mobx'
import { TestState } from '../test/test-model'
import type { IntervalID } from '../lib/types'

import type { StatsStoreStartInfo } from '@packages/types'

const defaults = {
  numPassed: 0,
  numFailed: 0,
  numPending: 0,

  _startTime: null,
  _currentTime: null,
}

class StatsStore {
  @observable numPassed: number = defaults.numPassed
  @observable numFailed: number = defaults.numFailed
  @observable numPending: number = defaults.numPending

  @observable _startTime: number | null = defaults._startTime
  @observable _currentTime: number | null = defaults._startTime;
  [key: string]: any

  private _interval?: IntervalID

  constructor () {
    makeObservable(this)
  }

  @computed get duration () {
    if (!this._startTime) return 0

    if (!this._currentTime) {
      throw new Error('StatsStore should be initialized with start() method.')
    }

    return this._currentTime - this._startTime
  }

  start ({ startTime, numPassed = 0, numFailed = 0, numPending = 0 }: StatsStoreStartInfo) {
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
    clearInterval(this._interval as IntervalID)
  }

  _updateCurrentTime () {
    this._currentTime = Date.now()
  }

  @action
  incrementCount (type: TestState) {
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
