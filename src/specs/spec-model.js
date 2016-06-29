import { observable, action } from 'mobx'

export default class Spec {
  @observable id
  @observable isLoading = false

  constructor (spec) {
    this.id = spec.id
  }

  @action loading (bool) {
    this.isLoading = bool
  }
}
