Promise   = require("bluebird")
extension = require("@cypress/core-extension")

module.exports = {
  get: (cookies, filter = {}) ->
    cookies.getAsync(filter)

  set: (cookies, props = {}) ->
    cookies.setAsync(props)

  remove: (cookies, cookie) ->
    url = extension.getCookieUrl(cookie)
    cookies.removeAsync(url, cookie.name)

  promisify: (cookies) ->
    Promise.promisifyAll(cookies)

  clearGithub: (cookies) ->
    cookies = @promisify(cookies)

    removeCookie = (cookie) =>
      @remove(cookies, cookie)

    cookies.getAsync({domain: "github.com"})
    .map(removeCookie)
    .return(null)
}