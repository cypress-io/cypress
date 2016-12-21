import _ from 'lodash'
import { observable, action } from 'mobx'

import Org from './organization-model'

export class Orgs {
  @observable orgs = []
  @observable error = null
  @observable isLoading = false
  @observable isLoaded = false
  @observable _membershipRequestedIds = {}

  @action setOrgs (orgs) {
    this.orgs = _.map(orgs, (org) => (
      new Org(org)
    ))

    this.isLoading = false
    this.isLoaded = true
  }

  getOrgById (id) {
    return _.find(this.orgs, { id })
  }

  membershipRequested (id) {
    this._membershipRequestedIds[id] = true
  }

  wasMembershipRequested (id) {
    return this._membershipRequestedIds[id] === true
  }
}

export default new Orgs()
