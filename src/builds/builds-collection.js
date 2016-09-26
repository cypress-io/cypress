import _ from 'lodash'
import { observable, action } from 'mobx'

import Build from './build-model'

export class BuildsCollection {
  @observable builds = []
  @observable error = null
  @observable isLoading = false
  @observable isLoaded = false

  @action loading (bool) {
    this.isLoading = bool
  }

  @action setBuilds (builds) {
    this.builds = _.map(builds, (build) => (
      new Build(build)
    ))

    this.isLoading = false
    this.isLoaded = true
  }

  @action setError (err) {
    this.error = err

    this.isLoading = false
    this.isLoaded = true
  }
}

export default new BuildsCollection()
