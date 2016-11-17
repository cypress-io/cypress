import _ from 'lodash'
import { observable, action } from 'mobx'

import Org from './organization-model'

export class Orgs {
  @observable orgs = []
  @observable error = null
  @observable isLoading = false
  @observable isLoaded = false

  @action setOrgs (orgs) {
    this.orgs = _.map(orgs, (org) => (
      new Org(org)
    ))

    this.isLoading = false
    this.isLoaded = true
  }
}

export default new Orgs()
