import { assign } from 'lodash'
import { observable } from 'mobx'

export default class Run {
  @observable id

  constructor (options) {
    assign(this, options)
  }
}
