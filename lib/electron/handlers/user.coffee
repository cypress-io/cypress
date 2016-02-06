session = require("../../session")
cache   = require("../../cache")

module.exports = {
  get: ->
    cache.getUser()

  getProjectToken: (session, project) ->
    cache.getProjectToken(session, project)

  generateProjectToken: (session, project) ->
    cache.generateProjectToken(session, project)

  logIn: (code) ->
    session.logIn(code)
    .then (user) ->
      cache.setUser(user)
      .return(user)

  logOut: (token) ->
    session.logOut(token)
    .then(cache.removeUserSession())

  ensureSession: ->
    @get().then (user) ->
      ## return session_token if we have one
      if user and st = user.session_token
        return st
      else
        ## else die and log out the auth error
        errors.throw("NOT_LOGGED_IN")
}