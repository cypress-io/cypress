import { computed, observable, action } from 'mobx'

import User from '../lib/user-model'

class State {
  @observable userLoaded = false
  @observable user = null
  @observable updateAvailable = false
  @observable modalOpen = false
  @observable version

  @computed get hasUser () {
    return !!this.user && !!this.user.authToken
  }

  @action setUser (user) {
    this.user = user && user.authToken ? new User(user) : null
  }

  @action setVersion (version) {
    this.version = version
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
