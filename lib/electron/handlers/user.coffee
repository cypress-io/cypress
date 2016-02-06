session = require("../../session")
cache   = require("../../cache")

module.exports = {
  get: ->
    cache.getUser()

  logIn: (code) ->
    session.logIn(code)
    .then (user) ->
      cache.setUser(user)
      .return(user)

  logOut: (token) ->
    session.logOut(token)
    .then(cache.removeUserSession())
    ## TODO: clear cookies here
}