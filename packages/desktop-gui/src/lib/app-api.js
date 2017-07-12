import ipc from './ipc'

const appApi = {
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
