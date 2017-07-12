import { action, computed, observable } from 'mobx'
import User from '../lib/user-model'

class AuthStore {
  @observable isShowingLogin = false
  @observable user = null

  @computed get isAuthenticated () {
    return !!this.user && !!this.user.authToken
  }

  @action setShowingLogin (isShowing) {
    this.isShowingLogin = isShowing
  }

  @action setUser (user) {
    const isValid = user && user.authToken
    this.user = isValid ? new User(user) : null
  }
}

export default new AuthStore()
