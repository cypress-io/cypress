import api from './api'
import { cache } from '../cache'

import type { CachedUser } from '@packages/types'
import type Bluebird from 'bluebird'

export = {
  get (): Bluebird<CachedUser> {
    return cache.getUser()
  },

  set (user: CachedUser): Bluebird<void> {
    return cache.setUser(user)
  },

  async getBaseLoginUrl (): Promise<string> {
    const res = await api.getAuthUrls()

    return res!.dashboardAuthUrl
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
