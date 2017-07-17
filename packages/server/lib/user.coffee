api     = require("./api")
cache   = require("./cache")
errors  = require("./errors")

module.exports = {
  get: ->
    cache.getUser()

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
    remove = ->
      cache.removeUser()

    @get()
    .then (user) ->
      authToken = user and user.authToken

      ## if we have a authToken
      ## then send it up
      if authToken
        api.createSignout(authToken)
        .then(remove)
      else
        ## else just remove the
        ## user from cache
        remove()

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
