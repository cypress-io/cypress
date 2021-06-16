import { observable, computed, action, makeObservable } from 'mobx'
import { uniqueId } from 'lodash'
import { durationFormatted } from '../lib/utils'

export default class Timer {
  milliseconds;

  constructor (initialMilliseconds = 0) {
    this.milliseconds = initialMilliseconds
    this.id = uniqueId()
    makeObservable(this, {
      milliseconds: observable,
      reset: action,
      display: computed,
    })
  }

  reset () {
    this.milliseconds = 0
  }

  get display () {
    return durationFormatted(this.milliseconds)
  }
}
