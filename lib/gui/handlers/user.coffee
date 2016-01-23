session = require("../../session")
cache   = require("../../cache")

module.exports = {
  get: ->
    cache.getUser()

  logIn: (code) ->
    session.logIn(code)
    .then (user) ->
      cache.setUser(user)
      .then ->
        ## TODO: what does cache
        ## setUser return us?
        send(null, user)

  logOut: (token) ->
    session.logOut(token)
    .then(cache.removeUserSession())
    ## TODO: clear cookies here
}