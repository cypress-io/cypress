import _ from 'lodash'
import { observable, action } from 'mobx'
import Spec from './spec-model'


class Specs {
  @observable specs = []
  @observable error = null
  @observable isLoading = false
  @observable isLoaded = false

  @action loading (bool) {
    this.isLoading = bool
  }

  @action setSpecs (specs) {
    this.specs = _.map(specs, (spec) => (
      new Spec(spec)
    ))
    this.isLoading = false
    this.isLoaded = true
  }
}

export default new Specs()
