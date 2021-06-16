import { observable, computed, action, makeObservable } from 'mobx'

import Timer from './duration-timer-model'
import dayjs from 'dayjs'

class TimerStore {
  isRunning = false;
  timer;
  startTime;

  constructor (startTime) {
    this.timer = new Timer()
    this.startTime = dayjs(startTime)
    makeObservable(this, {
      isRunning: observable,
      timer: observable,
      startTime: observable,
      mainDisplay: computed,
      measure: action,
      startTimer: action,
      resetTimer: action,
    })
  }

  get mainDisplay () {
    return this.timer.display
  }

  measure () {
    if (!this.isRunning) return

    this.timer.milliseconds = dayjs().diff(this.startTime)

    this.timerId = setTimeout(() => {
      return this.measure()
    }, 10)
  }

  startTimer () {
    if (this.isRunning) return

    this.isRunning = true
    this.measure()
  }

  resetTimer () {
    this.timer.reset()
    this.isRunning = false
    clearTimeout(this.timerId)
  }
}

export default TimerStore
