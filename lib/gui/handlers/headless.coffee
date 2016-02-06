user       = require("./user")
errors     = require("./errors")
Renderer   = require("./renderer")

ensureSessionToken = (user) ->
  ## bail if we have a session_token
  return true if user and user.session_token

  ## else die and log out the auth error
  errors.die("NOT_LOGGED_IN")

module.exports = {
  runHeadless: (app, options = {}) ->
    user.get().then (user) ->
      if ensureSessionToken(user)
        Renderer.create({
          width:  1280
          height: 720
          show:   false
          frame:  false
          type:   "PROJECT"
        })
}