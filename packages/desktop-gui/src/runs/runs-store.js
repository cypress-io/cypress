import _ from 'lodash'
import { observable, action } from 'mobx'
import moment from 'moment'

import Run from './run-model'

export class RunsStore {
  @observable runs = []
  @observable error = null
  @observable isLoading = false
  @observable isLoaded = false
  @observable lastUpdated

  @action setLoading (isLoading) {
    this.isLoading = isLoading
    this.error = null
  }

  @action setRuns (runs) {
    this.runs = _.map(runs, (run) => {
      return new Run(run)
    })

    this.lastUpdated = moment().format('h:mm:ssa')
    this.error = null
    this.isLoading = false
    this.isLoaded = true
  }

  @action setError (err) {
    this.error = err
    this.isLoading = false
  }
}

export default RunsStore
