import { assign } from 'lodash'
import { observable } from 'mobx'

export default class Usage {
  @observable plan
  @observable used

  constructor (usage) {
    assign(this, usage)
  }
}
