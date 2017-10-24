import { action, observable } from 'mobx'
import { SpecsStore } from './specs-store'

export default class Spec {
  @observable name
  @observable isChosen = false
  @observable isExpanded = false
  @observable children = new SpecsStore()

  constructor ({ name, displayName }) {
    this.name = name
    this.displayName = displayName
    this.isExpanded = true
  }
  
  hasChildren() {
    return this.children.specs && this.children.specs.length;
  }

  @action setChosen (isChosen) {
    this.isChosen = isChosen
  }

  @action setExpanded (isExpanded) {
    this.isExpanded = isExpanded
  }
}
