const api = require('./api')
const cache = require('./cache')
const keys = require('./util/keys')

export = {
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
}
