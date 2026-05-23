import api from './api'
import { cache } from '../cache'

import type { CachedUser } from '@packages/types'

const cloudUser = {
  get (): Promise<CachedUser> {
    return cache.getUser()
  },

  set (user: CachedUser): Promise<void> {
    return cache.setUser(user)
  },

  getBaseLoginUrl (): Promise<string> {
    return api.getAuthUrls().then((urls) => urls.dashboardAuthUrl)
  },

  getBaseSignupUrl (): Promise<string> {
    return api.getAuthUrls().then((urls) => urls.dashboardSignupUrl)
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
