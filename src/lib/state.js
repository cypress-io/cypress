import { computed, observable, action } from 'mobx'

import User from '../lib/user-model'

class State {
  @observable userLoaded = false
  @observable user = null
  @observable updateAvailable = false
  @observable modalOpen = false

  @computed get hasUser () {
    return !!this.user && !!this.user.session_token
  }

  @action setUser (user) {
    return this.user = user && user.session_token ? new User(user) : null
  }

  updatesAvailable (bool) {
    this.updateAvailable = bool
  }

  openModal () {
    this.modalOpen = true
  }

  closeModal () {
    this.modalOpen = false
  }

}

export default new State()
