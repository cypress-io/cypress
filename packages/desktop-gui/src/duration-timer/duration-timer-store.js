import { observable, computed, action } from 'mobx'
import moment from 'moment'

import Timer from './duration-timer-model'

class DurationTimer {
  @observable isRunning = false
  @observable timer
  @observable startTime

  constructor (startTime) {
    this.timer = new Timer()
    this.startTime = moment(startTime)
  }

  @computed get mainDisplay () {
    return this.timer.display
  }

  @action measure () {
    if (!this.isRunning) return

    this.timer.milliseconds = moment().diff(this.startTime)

    this.timerId = setTimeout(() => this.measure(), 10)
  }

  @action startTimer () {
    if (this.isRunning) return
    this.isRunning = true
    this.measure()
  }

  @action resetTimer () {
    this.timer.reset()
    this.isRunning = false
    clearTimeout(this.timerId)
  }
}

export default DurationTimer
