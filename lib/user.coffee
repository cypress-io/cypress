api     = require("../../api")
cache   = require("../../cache")
errors  = require("./errors")

module.exports = {
  get: ->
    cache.getUser()

  getLoginUrl: ->
    api.getLoginUrl()

  getProjectToken: (session, projectPath) ->
    cache.getProjectToken(session, projectPath)

  generateProjectToken: (session, projectPath) ->
    cache.generateProjectToken(session, projectPath)

  logIn: (code) ->
    api.createSignin(code)
    .then (user) ->
      cache.setUser(user)
      .return(user)

  logOut: ->
    remove = ->
      cache.removeUser()

    @get()
    .then (user) ->
      session = user and user.session_token

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
      ## return session_token if we have one
      if user and st = user.session_token
        return st
      else
        ## else throw the not logged in error
        errors.throw("NOT_LOGGED_IN")
}