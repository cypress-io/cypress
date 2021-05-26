import _ from 'lodash'
import { action, observable } from 'mobx'

import Run from './run-model'
import dayjs from 'dayjs'

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

    this.lastUpdated = dayjs().format('h:mm:ssa')
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
