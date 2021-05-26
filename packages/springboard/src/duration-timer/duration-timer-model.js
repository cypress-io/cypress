import { observable, computed, action } from 'mobx'
import { uniqueId } from 'lodash'
import { durationFormatted } from '../lib/utils'

export default class Timer {
  @observable milliseconds

  constructor (initialMilliseconds = 0) {
    this.milliseconds = initialMilliseconds
    this.id = uniqueId()
  }

  @action reset () {
    this.milliseconds = 0
  }

  @computed get display () {
    return durationFormatted(this.milliseconds)
  }
}
