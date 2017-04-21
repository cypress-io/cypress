import ipc from './ipc'
import state from './state'
import updater from '../update/update-model'

const appApi = {
  logOut () {
    state.setUser(null)

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
