import appStore from '../lib/app-store'
import authStore from './auth-store'
import ipc from '../lib/ipc'

class AuthApi {
  loadUser () {
    ipc.getCurrentUser()
    .then((user) => {
      authStore.setUser(user)

      // mobx can trigger a synchronous re-render, which executes
      // componentDidMount, etc in other components, making bluebird
      // think another promise was created but not returned
      // return null to prevent bluebird warning about it
      // same goes for other `return null`s below
      return null
    })
    .catch(ipc.isUnauthed, ipc.handleUnauthed)
    .finally(() => {
      authStore.setLoading(false)
    })
  }

  login () {
    return ipc.beginAuth()
    .then((user) => {
      authStore.setUser(user)

      return null
    })
    .catch({ alreadyOpen: true }, () => {})
  }

  logOut () {
    authStore.setUser(null)

    ipc.clearGithubCookies()
    ipc.logOut()
    .catch((err) => {
      err.name = 'An unexpected error occurred while logging out'
      appStore.setError(err)
    })
  }
}

export default new AuthApi()
