import _ from 'lodash'
import { observable, action } from 'mobx'

import Org from './organization-model'

export class Orgs {
  @observable orgs = []
  @observable error = null
  @observable isLoading = false

  @action setOrgs (orgs) {
    this.orgs = _.map(orgs, (org) => {
      return new Org(org)
    })
  }

  @action setError (err) {
    this.error = err
  }

  @action setLoading (isLoading) {
    this.isLoading = isLoading
  }

  getOrgById (id) {
    return _.find(this.orgs, { id })
  }
}

export default new Orgs()
