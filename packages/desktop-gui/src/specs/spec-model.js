import { action, observable } from 'mobx'

export default class Spec {
  @observable name
  @observable displayName
  @observable path
  @observable isChosen = false
  @observable isExpanded = false
  @observable children = []

  constructor ({ name, displayName, path }) {
    this.name = name
    this.displayName = displayName
    this.path = path
    this.isExpanded = true
  }

  hasChildren () {
    return this.children && this.children.length
  }

  @action setChosen (isChosen) {
    this.isChosen = isChosen
  }

  @action setExpanded (isExpanded) {
    this.isExpanded = isExpanded
  }
}
