import { observable, computed, action } from 'mobx'
import moment from 'moment'

import Timer from './duration-timer-model'

class DurationTimer {
  @observable isRunning = false
  @observable timer = new Timer()
  @observable startTime

  @computed get mainDisplay () {
    return this.timer.display
  }

  @computed get hasStarted () {
    return this.timer.totalMilliSeconds !== 0
  }

  @action measure () {
    if (!this.isRunning) return

    this.timer.milliseconds = moment().diff(this.startTime)

    setTimeout(() => this.measure(), 10)
  }

  @action startTimer (startTime) {
    if (this.isRunning) return
    this.isRunning = true
    this.startTime = moment(startTime)
    this.measure()
  }

  @action resetTimer () {
    this.timer.reset()
    this.isRunning = false
  }
}

export default new DurationTimer()
