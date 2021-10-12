import { action, computed, observable } from 'mobx'

export default class Folder {
  @observable path
  @observable displayName
  @observable specType
  @observable isExpanded = true
  @observable children = []

  isFolder = true

  constructor ({ path, displayName, specType }) {
    this.path = path
    this.displayName = displayName
    this.specType = specType || 'e2e'
  }

  @computed get hasChildren () {
    return this.children.length
  }

  @action setExpanded (isExpanded) {
    this.isExpanded = isExpanded
  }
}
