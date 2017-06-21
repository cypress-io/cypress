import ipc from './ipc'
import authStore from './auth-store'
import updater from '../update/update-model'

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
        case 'check:for:updates':
          updater.openUpdateWindow()
          break
        default:
          return
      }
    })
  },
}

export default appApi
