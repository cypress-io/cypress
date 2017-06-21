import { action, computed, observable } from 'mobx'
import User from '../lib/user-model'
import viewStore from './view-store'

class AuthStore {
  @observable user = null

  @computed get isAuthenticated () {
    return !!this.user && !!this.user.authToken
  }

  @action setUser (user) {
    const isValid = user && user.authToken
    this.user = isValid ? new User(user) : null

    if (isValid) {
      viewStore.showApp()
    } else {
      viewStore.showLogin()
    }
  }
}

export default new AuthStore()
