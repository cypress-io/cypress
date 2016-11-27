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
      session = user and user.sessionToken

      ## if we have a session
      ## then send it up
      if session
        api.createSignout(session)
        .then(remove)
      else
        ## else just remove the
        ## user from cache
        remove()

  ensureSession: ->
    @get().then (user) ->
      ## return sessionToken if we have one
      if user and st = user.sessionToken
        return st
      else
        ## else throw the not logged in error
        errors.throw("NOT_LOGGED_IN")
}