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

register('add:project')
register('begin:auth')
register('on:auth:message', false)
register('close:browser')
register('close:project')
register('external:open')
register('get:current:user')
register('get:orgs')
register('gui:error')
register('get:runs')
register('get:options')
register('get:projects')
register('get:project:statuses')
register('get:project:status')
register('get:record:keys')
register('get:release:notes')
register('get:specs', false)
register('get:user:editor')
register('set:user:editor')
register('launch:browser', false)
register('log:out')
register('on:focus:tests', false)
register('on:menu:clicked', false)
register('open:file')
register('open:finder')
register('open:project', false)
register('on:config:changed', false)
register('on:spec:changed', false)
register('on:project:error', false)
register('on:project:warning', false)
register('ping:api:server')
register('ping:baseUrl')
register('remove:project')
register('request:access')
register('setup:dashboard:project')
register('show:directory:dialog')
register('updater:check', false)
register('updater:run', false)
register('window:open')
register('window:close')
register('onboarding:closed')
register('set:clipboard:text')

export default ipc
