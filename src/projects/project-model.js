import _ from 'lodash'
import { computed, observable } from 'mobx'

export default class ProjectModel {
  @observable path = ''

  constructor (path) {
    this.path = path
  }

  @computed get name () {
    return _.last(this.path.split('/'))
  }
}
