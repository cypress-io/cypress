import { action, observable } from 'mobx'
import { SpecsStore } from './specs-store'

export default class Spec {
  @observable name
  @observable isChosen = false
  @observable children = new SpecsStore()

  constructor ({ name, displayName }) {
    this.name = name
    this.displayName = displayName
  }

  @action setChosen (isChosen) {
    this.isChosen = isChosen
  }
}
