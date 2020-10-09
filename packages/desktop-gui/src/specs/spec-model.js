import _ from 'lodash'
import { computed, observable } from 'mobx'

export default class Spec {
  @observable path
  @observable name
  @observable absolute
  @observable displayName
  // TODO clarify the role of "type" vs "specType"
  @observable type
  @observable specType // "integration" | "component"
  @observable isChosen = false

  constructor ({ path, name, absolute, relative, displayName, type, specType }) {
    this.path = path
    this.name = name
    this.absolute = absolute
    this.relative = relative
    this.displayName = displayName
    this.type = type
    this.specType = specType || 'integration'
  }

  @computed get hasChildren () {
    return false
  }

  @computed get file () {
    return _.pick(this, 'name', 'absolute', 'relative')
  }
}
