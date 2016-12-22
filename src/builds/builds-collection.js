import _ from 'lodash'
import { observable, action } from 'mobx'
import moment from 'moment'

import Build from './build-model'

export class BuildsCollection {
  @observable builds = []
  @observable error = null
  @observable isLoading = false
  @observable isLoaded = false
  @observable lastUpdated

  @action loading (bool) {
    this.isLoading = bool
    this.error = null
  }

  @action setBuilds (builds) {
    this.builds = _.map(builds, (build) => (
      new Build(build)
    ))

    this.lastUpdated = moment().format("h:mm:ssa")
    this.error = null
    this.isLoading = false
    this.isLoaded = true
  }

  @action setError (err) {
    this.error = err
    this.isLoading = false
  }
}

export default BuildsCollection
