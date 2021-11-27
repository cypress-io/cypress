import errors from './errors'
import authStore from '../auth/auth-store'

const ipc = {
  isUnauthed (error) {
    return errors.isUnauthenticated(error)
  },
  handleUnauthed () {
    authStore.setUser(null)

    ipc.logOut()
  },
}

export default ipc
