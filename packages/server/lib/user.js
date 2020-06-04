const debug = require('debug')('cypress:server:user')
const api = require('./api')
const cache = require('./cache')
const errors = require('./errors')
const keys = require('./util/keys')

module.exports = {
  get () {
    return cache.getUser()
  },

  getSafely () {
    return this.get()
    .tap((user) => {
      if (user.authToken) {
        user.authToken = keys.hide(user.authToken)
      }
    })
  },

  set (user) {
    return cache.setUser(user)
  },

  getBaseLoginUrl () {
    return api.getAuthUrls()
    .get('dashboardAuthUrl')
  },

  logOut () {
    return this.get().then((user) => {
      const authToken = user && user.authToken

      return cache.removeUser().then(() => {
        if (authToken) {
          return api.postLogout(authToken)
        }
      })
    })
  },

  syncProfile (authToken) {
    debug('synchronizing user profile')

    return api.getMe(authToken)
    .then((res) => {
      debug('received /me %o', res)
      const user = {
        authToken,
        name: res.name,
        email: res.email,
      }

      return this.set(user)
      .return(user)
    })
  },

  ensureAuthToken () {
    return this.get().then((user) => {
      // return authToken if we have one
      let at

      if (user && (at = user.authToken)) {
        debug('found authToken %s', at)

        return at
      }

      // else throw the not logged in error
      const error = errors.get('NOT_LOGGED_IN')

      // tag it as api error since the user is only relevant
      // in regards to the api
      error.isApiError = true
      throw error
    })
  },
}
