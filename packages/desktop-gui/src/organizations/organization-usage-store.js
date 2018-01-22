import { observable, action } from 'mobx'

import Usage from './organization-usage-model'

export class OrgUsage {
  @observable usage = null
  @observable error = null
  @observable isLoading = false
  @observable isLoaded = false

  @action setOrgUsage (usage) {
    this.usage = new Usage(usage)

    this.isLoading = false
    this.isLoaded = true
  }

  @action setError (err) {
    this.error = err
  }
}

export default new OrgUsage()
