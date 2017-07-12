import authStore from './auth-store'
import ipc from '../lib/ipc'
import viewStore from '../lib/view-store'

class AuthApi {
  login () {
    const alreadyOpen = (err) => {
      return err && err.alreadyOpen
    }

    return ipc.windowOpen({
      position: 'center',
      focus: true,
      width: 1000,
      height: 635,
      preload: false,
      title: 'Login',
      type: 'GITHUB_LOGIN',
    })
    .then((code) => {
      return ipc.logIn(code)
    })
    .then((user) => {
      authStore.setUser(user)
      viewStore.showPreviousView()
      return null
    })
    .catch(alreadyOpen, () => {})
  }

  logOut () {
    authStore.setUser(null)

    ipc.clearGithubCookies()
    ipc.logOut()
  }
}

export default new AuthApi()
