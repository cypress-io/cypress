import ipc from './ipc'
import authStore from './auth-store'

const appApi = {
  logOut () {
    authStore.setUser(null)

    ipc.clearGithubCookies()
    ipc.logOut()
  },

  listenForMenuClicks () {
    ipc.onMenuClicked((err, item) => {
      switch (item) {
        case 'log:out':
          this.logOut()
          break
        default:
          return
      }
    })
  },
}

export default appApi
