const api = require('./api').default
const cache = require('../cache')

import type { CachedUser } from '@packages/types'
import type Bluebird from 'bluebird'

export = {
  get (): Bluebird<CachedUser> {
    return cache.getUser()
  },

  set (user: CachedUser): Bluebird<CachedUser> {
    return cache.setUser(user)
  },

  getBaseLoginUrl (): string {
    return api.getAuthUrls().get('dashboardAuthUrl')
  },

  logOut () {
    return this.get().then((user) => {
      const authToken = user && user.authToken

      return cache.removeUser().then(() => {
        if (authToken) {
          return api.postLogout(authToken)
        }

        return undefined
      })
    })
  },
}
