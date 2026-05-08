import api from './api'
import { cache } from '../cache'

import type { CachedUser } from '@packages/types'
import type Bluebird from 'bluebird'

const cloudUser = {
  get (): Bluebird<CachedUser> {
    return cache.getUser()
  },

  set (user: CachedUser): Bluebird<void> {
    return cache.setUser(user)
  },

  getBaseLoginUrl (): Bluebird<string> {
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

export default cloudUser
