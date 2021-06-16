import _ from 'lodash'
import { action, observable, makeObservable } from 'mobx'

import Run from './run-model'
import dayjs from 'dayjs'

export class RunsStore {
  runs = [];
  error = null;
  isLoading = false;
  isLoaded = false;
  lastUpdated;

  constructor () {
    makeObservable(this, {
      runs: observable,
      error: observable,
      isLoading: observable,
      isLoaded: observable,
      lastUpdated: observable,
      setLoading: action,
      setRuns: action,
      setError: action,
    })
  }

  setLoading (isLoading) {
    this.isLoading = isLoading
    this.error = null
  }

  setRuns (runs) {
    this.runs = _.map(runs, (run) => {
      return new Run(run)
    })

    this.lastUpdated = dayjs().format('h:mm:ssa')
    this.error = null
    this.isLoading = false
    this.isLoaded = true
  }

  setError (err) {
    this.error = err
    this.isLoading = false
  }
}

export default RunsStore
