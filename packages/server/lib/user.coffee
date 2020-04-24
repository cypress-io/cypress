debug   = require("debug")("cypress:server:user")
api     = require("./api")
cache   = require("./cache")
errors  = require("./errors")
keys    = require("./util/keys")

module.exports = {
  get: ->
    cache.getUser()

  getSafely: ->
    @get()
    .tap (user) ->
      if user.authToken
        ## obfuscate the userToken key
        user.authToken = keys.hide(user.authToken)

  set: (user) ->
    cache.setUser(user)

  getBaseLoginUrl: ->
    api.getAuthUrls()
    .get('dashboardAuthUrl')

  logOut: ->
    @get().then (user) ->
      authToken = user and user.authToken

      cache.removeUser().then ->
        if authToken
          api.postLogout(authToken)

  syncProfile: (authToken) ->
    debug("synchronizing user profile")
    api.getMe(authToken)
    .then (res) =>
      debug("received /me %o", res)
      user = {
        authToken
        name: res.name
        email: res.email
      }
      @set(user)
      .return(user)

  ensureAuthToken: ->
    @get().then (user) ->
      ## return authToken if we have one
      if user and at = user.authToken
        debug("found authToken %s", at)
        return at
      else
        ## else throw the not logged in error
        error = errors.get("NOT_LOGGED_IN")
        ## tag it as api error since the user is only relevant
        ## in regards to the api
        error.isApiError = true
        throw error
}
