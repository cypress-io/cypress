import { observable, makeObservable } from 'mobx'

export default class Org {
  id;
  name;
  default;

  constructor (org) {
    makeObservable(this, {
      id: observable,
      name: observable,
      default: observable,
    })

    this.id = org.id
    this.name = org.name
    this.default = org.default
  }
}
