import { observable } from 'mobx'

export default class Org {
  @observable id
  @observable name
  @observable default

  constructor (org) {
    this.id = org.id
    this.name = org.name
    this.default = org.default
  }
}
