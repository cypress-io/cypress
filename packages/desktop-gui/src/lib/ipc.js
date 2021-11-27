import _ from 'lodash'

import ipcBus from './ipc-bus'
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

const register = (eventName, isPromiseApi = true) => {
  ipc[_.camelCase(eventName)] = (...args) => {
    // console.log('ipc', eventName, 'called with', args) // NOTE: uncomment to debug ipc
    return ipcBus(eventName, ...args)
  }

  if (!isPromiseApi) {
    ipc[_.camelCase(`off:${eventName}`)] = () => {
      return ipcBus.off(eventName)
    }
  }
}

register('show:directory:dialog')
register('show:new:spec:dialog')
register('updater:check', false)
register('updater:run', false)
register('window:open')
register('window:close')
register('new:project:banner:closed')
register('has:opened:cypress')
register('remove:scaffolded:files')
register('set:clipboard:text')
register('set:prompt:shown')

export default ipc
