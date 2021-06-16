import _ from 'lodash'
import { observable, action, makeObservable } from 'mobx'

import Org from './organization-model'

export class Orgs {
  orgs = [];
  error = null;
  isLoading = false;
  isLoaded = false;

  constructor () {
    makeObservable(this, {
      orgs: observable,
      error: observable,
      isLoading: observable,
      isLoaded: observable,
      setOrgs: action,
      setError: action,
    })
  }

  setOrgs (orgs) {
    this.orgs = _.map(orgs, (org) => {
      return (
        new Org(org)
      )
    })

    this.isLoading = false
    this.isLoaded = true
  }

  setError (err) {
    this.error = err
  }

  getOrgById (id) {
    return _.find(this.orgs, { id })
  }
}

export default new Orgs()
