_         = require("lodash")
Promise   = require("bluebird")
extension = require("@cypress/core-extension")

module.exports = {
  get: (cookies, filter = {}) ->
    cookies = @promisify(cookies)
    cookies.getAsync(filter)

  set: (cookies, props = {}) ->
    cookies = @promisify(cookies)
    props.url = extension.getCookieUrl(props)

    ## TODO: there is a bug in electron when throwing
    ## when trying to set a cookie with property domain
    p = _.pick(props, "url", "name", "value", "path", "httpOnly", "secure", "expirationDate")

    cookies.setAsync(p)

  remove: (cookies, cookie) ->
    cookies = @promisify(cookies)
    url = extension.getCookieUrl(cookie)
    cookies.removeAsync(url, cookie.name)

  promisify: (cookies) ->
    ## dont re-promisify if we have already
    ## promisified the cookies
    return cookies if cookies.__isPromisified

    cookies.__isPromisified = true
    Promise.promisifyAll(cookies)

  clearGithub: (cookies) ->
    removeCookie = (cookie) =>
      @remove(cookies, cookie)

    @get(cookies, {domain: "github.com"})
    .map(removeCookie)
    .return(null)
}