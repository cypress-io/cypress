Promise = require("bluebird")
api     = require("./api")

module.exports = {
  getLoginUrl: ->
    ## temporarily commenting this out
    # request(Routes.auth(), {json: true})
    url = "https://github.com/login/oauth/authorize?client_id=71bdc3730cd85d30955a&scope=user:email"
    Promise.delay(1000).return(url)

  ## move this to an auth module
  ## and update NW references
  logIn: (code) ->
    api.createSignin(code)

  logOut: (session) ->
    api.createSignout(session)
}