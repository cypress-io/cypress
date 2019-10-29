import authApi from '../auth/auth-api'
import ThemeProvider from '../theme/theme'
import ipc from './ipc'

const appApi = {
  listenForMenuClicks () {
    ipc.onMenuClicked((err, item) => {
      switch (item) {
        case 'log:out':
          authApi.logOut()
          break
        case 'toggle:theme':
          ThemeProvider.toggleTheme()
          break
        default:
          return
      }
    })
  },
}

export default appApi
