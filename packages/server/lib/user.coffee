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

  getLoginUrl: ->
    api.getLoginUrl()

  logIn: (code) ->
    api.createSignin(code)
    .then (user) =>
      @set(user)
      .return(user)

  logOut: ->
    @get().then (user) ->
      authToken = user and user.authToken

      cache.removeUser().then ->
        if authToken
          api.createSignout(authToken)

  ensureAuthToken: ->
    @get().then (user) ->
      ## return authToken if we have one
      if user and at = user.authToken
        return at
      else
        ## else throw the not logged in error
        error = errors.get("NOT_LOGGED_IN")
        ## tag it as api error since the user is only relevant
        ## in regards to the api
        error.isApiError = true
        throw error
}
