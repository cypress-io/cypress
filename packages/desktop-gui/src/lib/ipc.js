import _ from 'lodash'

import App from './app'
import errors from './errors'
import state from './state'

const ipc = {
  isUnauthed (error) {
    return errors.isUnauthenticated(error)
  },
  handleUnauthed () {
    state.setUser(null)

    ipc.clearGithubCookies()
    ipc.logOut()
  },
}

const register = (eventName, isPromiseApi = true) => {
  ipc[_.camelCase(eventName)] = (...args) => App.ipc(eventName, ...args)
  if (!isPromiseApi) {
    ipc[_.camelCase(`off:${eventName}`)] = () => App.ipc.off(eventName)
  }
}

register('add:project')
register('clear:github:cookies')
register('close:browser')
register('close:project')
register('external:open')
register('get:current:user')
register('get:orgs')
register('gui:error')
register('get:builds')
register('get:options')
register('get:projects')
register('get:project:statuses')
register('get:project:status')
register('get:record:keys')
register('get:specs', false)
register('launch:browser', false)
register('log:in')
register('log:out')
register('on:focus:tests', false)
register('on:menu:clicked', false)
register('open:finder')
register('open:project', false)
register('remove:project')
register('request:access')
register('setup:dashboard:project')
register('show:directory:dialog')
register('updater:check', false)
register('updater:run', false)
register('window:open')
register('window:close')
register('onboarding:closed')

export default ipc
