import { action, computed, observable, makeObservable } from 'mobx'

export default class Folder {
  path;
  displayName;
  specType;
  isExpanded = true;
  children = [];

  isFolder = true

  constructor ({ path, displayName, specType }) {
    makeObservable(this, {
      path: observable,
      displayName: observable,
      specType: observable,
      isExpanded: observable,
      children: observable,
      hasChildren: computed,
      setExpanded: action,
    })

    this.path = path
    this.displayName = displayName
    this.specType = specType || 'integration'
  }

  get hasChildren () {
    return this.children.length
  }

  setExpanded (isExpanded) {
    this.isExpanded = isExpanded
  }
}
