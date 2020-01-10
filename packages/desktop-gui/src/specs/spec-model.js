import _ from 'lodash'
import { computed, observable } from 'mobx'

export default class Spec {
  @observable path
  @observable name
  @observable absolute
  @observable displayName
  @observable type
  @observable isChosen = false

  constructor ({ path, name, absolute, relative, displayName, type }) {
    this.path = path
    this.name = name
    this.absolute = absolute
    this.relative = relative
    this.displayName = displayName
    this.type = type
  }

  @computed get hasChildren () {
    return false
  }

  @computed get file () {
    return _.pick(this, 'name', 'absolute', 'relative')
  }
}
