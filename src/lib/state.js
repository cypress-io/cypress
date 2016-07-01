import { computed, observable } from 'mobx'

import User from '../lib/user-model'

class State {
  @observable user = null
  @observable updateAvailable = false

  @computed get hasUser () {
    return !!this.user && !!this.user.session_token
  }

  setUser (user) {
    this.user = user && user.session_token ? new User(user) : null
  }

  updatesAvailable (bool) {
    this.updateAvailable = bool
  }
}

export default new State()
