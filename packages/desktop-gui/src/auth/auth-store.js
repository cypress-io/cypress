import { action, computed, observable } from 'mobx'
import User from '../lib/user-model'

class AuthStore {
  @observable isLoading = true
  @observable isShowingLogin = false
  @observable loginUTM = null
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

  @action openLogin (onCloseCb, loginUTM = null) {
    this.onCloseCb = onCloseCb

    this.setMessage(null)
    this.isShowingLogin = true
    this.loginUTM = loginUTM
  }

  @action closeLogin () {
    if (this.onCloseCb) {
      this.onCloseCb(this.isAuthenticated)
    }

    this.setMessage(null)
    this.isShowingLogin = false
    this.loginUTM = false
  }

  @action setUser (user) {
    const isValid = user && user.authToken

    this.user = isValid ? new User(user) : null
  }
}

export default new AuthStore()
