import { computed, observable } from 'mobx'

import C from './constants'
import User from '../lib/user-model'

class State {
  @observable appState = C.LOADING_OPTIONS
  @observable projectPath
  @observable user = null
  @observable updateAvailable = false
  @observable modalOpen = false
  @observable version

  @computed get hasUser () {
    return !!this.user && !!this.user.authToken
  }

  @computed get projectPathUri () {
    return this.projectPath ? encodeURIComponent(this.projectPath) : ''
  }

  setUser (user) {
    const isValid = user && user.authToken
    if (!isValid) this.appState = C.NO_USER
    this.user = isValid ? new User(user) : null
  }

  openModal () {
    this.modalOpen = true
  }

  closeModal () {
    this.modalOpen = false
  }
}

export default new State()
