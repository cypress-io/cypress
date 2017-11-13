import { assign } from 'lodash'
import { observable } from 'mobx'

export default class Org {
  @observable id
  @observable name
  @observable default
  @observable overPrivateProjectsLimit

  constructor (org) {
    assign(this, org)
  }
}
