import { assign } from 'lodash'
import { computed, observable } from 'mobx'
import moment from 'moment'

export default class Run {
  @observable id

  constructor (options) {
    assign(this, options)
  }

  @computed get duration () {
    return Math.abs(moment.duration(moment(this.wallClockEndedAt).diff(moment(this.wallClockStartedAt))))
  }
}
