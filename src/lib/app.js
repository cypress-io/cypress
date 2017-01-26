import ipc from './ipc'
import errors from './errors'

let onUnauth = () => {}

ipc.onError((err) => {
  if (errors.isUnauthenticated(err)) {
    onUnauth()
  }
})

const App = {
  ipc,
  onUnauth (cb) {
    onUnauth = cb
  },
}

window.App = App

export default App
