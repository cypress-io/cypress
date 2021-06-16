import _ from 'lodash'
import { computed, observable, makeObservable } from 'mobx'

export default class Spec {
  path;
  name;
  absolute;
  displayName;
  // TODO clarify the role of "type" vs "specType"
  type;
  specType; // "integration" | "component"
  isChosen = false;

  constructor ({ path, name, absolute, relative, displayName, type, specType }) {
    makeObservable(this, {
      path: observable,
      name: observable,
      absolute: observable,
      displayName: observable,
      type: observable,
      specType: observable,
      isChosen: observable,
      hasChildren: computed,
      file: computed,
    })

    this.path = path
    this.name = name
    this.absolute = absolute
    this.relative = relative
    this.displayName = displayName
    this.type = type
    this.specType = specType || 'integration'
  }

  get hasChildren () {
    return false
  }

  get file () {
    return _.pick(this, 'name', 'absolute', 'relative')
  }
}
