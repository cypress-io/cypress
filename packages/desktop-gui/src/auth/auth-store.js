import { action, computed, observable, makeObservable } from 'mobx'
import User from '../lib/user-model'

class AuthStore {
  isLoading = true;
  isShowingLogin = false;
  loginUTM = null;
  user = null;
  message = null;

  constructor () {
    makeObservable(this, {
      isLoading: observable,
      isShowingLogin: observable,
      loginUTM: observable,
      user: observable,
      message: observable,
      isAuthenticated: computed,
      setLoading: action,
      setMessage: action,
      openLogin: action,
      closeLogin: action,
      setUser: action,
    })
  }

  get isAuthenticated () {
    return !!this.user && !!this.user.authToken
  }

  setLoading (isLoading) {
    this.isLoading = isLoading
  }

  setMessage (message) {
    this.message = message
  }

  openLogin (onCloseCb, loginUTM = null) {
    this.onCloseCb = onCloseCb

    this.setMessage(null)
    this.isShowingLogin = true
    this.loginUTM = loginUTM
  }

  closeLogin () {
    if (this.onCloseCb) {
      this.onCloseCb(this.isAuthenticated)
    }

    this.setMessage(null)
    this.isShowingLogin = false
    this.loginUTM = false
  }

  setUser (user) {
    const isValid = user && user.authToken

    this.user = isValid ? new User(user) : null
  }
}

export default new AuthStore()
