import authApi from '../auth/auth-api'
import ipc from './ipc'

const appApi = {
  listenForMenuClicks () {
    ipc.onMenuClicked((err, item) => {
      switch (item) {
        case 'log:out':
          authApi.logOut()
          break
        default:
          return
      }
    })
  },
}

export default appApi
