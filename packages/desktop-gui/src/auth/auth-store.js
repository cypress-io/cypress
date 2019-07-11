import { action, computed, observable } from 'mobx'
import User from '../lib/user-model'

class AuthStore {
  @observable isLoading = true
  @observable isShowingLogin = false
  @observable user = null
  @observable message = null

  @computed get isAuthenticated () {
    return !!this.user && !!this.user.authToken
  }

  @action setLoading (isLoading) {
    this.isLoading = isLoading
  }

  @action setMessage (message) {
    this.message = message
  }

  @action setShowingLogin (isShowing) {
    this.setMessage(null)
    this.isShowingLogin = isShowing
  }

  @action setUser (user) {
    const isValid = user && user.authToken

    this.user = isValid ? new User(user) : null
  }
}

export default new AuthStore()
