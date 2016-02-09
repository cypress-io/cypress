api   = require("../../api")
cache = require("../../cache")

module.exports = {
  get: ->
    cache.getUser()

  getLoginUrl: ->
    # api.getLoginUrl()
    url = "https://github.com/login/oauth/authorize?client_id=71bdc3730cd85d30955a&scope=user:email"
    Promise.delay(1000).return(url)

  getProjectToken: (session, projectPath) ->
    cache.getProjectToken(session, projectPath)

  generateProjectToken: (session, projectPath) ->
    cache.generateProjectToken(session, projectPath)

  logIn: (code) ->
    api.createSignin(code)
    .then (user) ->
      cache.setUser(user)
      .return(user)

  logOut: (session) ->
    api.createSignout(session)
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