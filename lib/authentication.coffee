Promise = require("bluebird")
request = require("request-promise")
errors  = require("request-promise/errors")
Routes  = require("./util/routes")

module.exports = {
  getLoginUrl: ->
    ## temporarily commenting this out
    # request(Routes.auth(), {json: true})
    url = "https://github.com/login/oauth/authorize?client_id=71bdc3730cd85d30955a&scope=user:email"
    Promise.delay(1000).return(url)

  ## move this to an auth module
  ## and update NW references
  logIn: (code) ->
    url = Routes.signin({code: code})
    request.post(url, {json: true})
    .catch errors.StatusCodeError, (err) ->
      ## slice out the status code since RP automatically
      ## adds this before the message
      err.message = err.message.split(" - ").slice(1).join("")
      throw err

  logOut: (token) ->
    url = Routes.signout()
    headers = {"X-Session": token}
    request.post({url: url, headers: headers})
}