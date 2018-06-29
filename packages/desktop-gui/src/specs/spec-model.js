import _ from 'lodash'
import { action, observable } from 'mobx'

export default class Spec {
  @observable name
  @observable path
  @observable displayName
  @observable isChosen = false
  @observable isExpanded = false
  @observable children = []

  constructor ({ obj, name, displayName, path }) {
    this.obj = obj
    this.name = name
    this.path = path
    this.isExpanded = true
    this.displayName = displayName
  }

  getStateProps () {
    return _.pick(this, 'isChosen', 'isExpanded')
  }

  hasChildren () {
    return this.children && this.children.length
  }

  @action merge (other) {
    _.extend(this, other.getStateProps())
  }

  @action setChosen (isChosen) {
    this.isChosen = isChosen
  }

  @action setExpanded (isExpanded) {
    this.isExpanded = isExpanded
  }
}
