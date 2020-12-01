import { observable, computed, action } from 'mobx'

import Timer from './duration-timer-model'
import dayjs from 'dayjs'

class TimerStore {
  @observable isRunning = false
  @observable timer
  @observable startTime

  constructor (startTime) {
    this.timer = new Timer()
    this.startTime = dayjs(startTime)
  }

  @computed get mainDisplay () {
    return this.timer.display
  }

  @action measure () {
    if (!this.isRunning) return

    this.timer.milliseconds = dayjs().diff(this.startTime)

    this.timerId = setTimeout(() => {
      return this.measure()
    }, 10)
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

export default TimerStore
