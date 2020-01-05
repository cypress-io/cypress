import _ from 'lodash'
import { computed, observable } from 'mobx'

export default class Spec {
  @observable path
  @observable name
  @observable absolute
  @observable displayName
  // TODO clarify the role of "type" vs "testType"
  @observable type
  @observable testType // integration | component
  @observable isChosen = false

  constructor ({ path, name, absolute, relative, displayName, type, testType }) {
    this.path = path
    this.name = name
    this.absolute = absolute
    this.relative = relative
    this.displayName = displayName
    this.type = type
    this.testType = testType
  }

  @computed get hasChildren () {
    return false
  }

  @computed get file () {
    return _.pick(this, 'name', 'absolute', 'relative')
  }
}
