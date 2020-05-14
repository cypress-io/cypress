import { action, computed, observable } from 'mobx'

export default class Folder {
  @observable path
  @observable displayName
  @observable isExpanded = true
  @observable children = []

  isFolder = true

  constructor ({ path, displayName }) {
    this.path = path
    this.displayName = displayName
  }

  @computed get hasChildren () {
    return this.children.length
  }

  @action setExpanded (isExpanded) {
    this.isExpanded = isExpanded
  }
}
