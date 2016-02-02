_        = require("lodash")
Promise  = require("bluebird")

module.exports = {
  clearGithub: (cookies) ->
    cookies = Promise.promisifyAll(cookies)

    removeCookie = (cookie) ->
      prefix = if cookie.secure then "https://" else "http://"
      if cookie.domain[0] is "."
        prefix += "www"

      url = prefix + cookie.domain + cookie.path

      cookies.removeAsync(url, cookie.name)

    cookies.getAsync({domain: "github.com"})
    .map(removeCookie)
    .then -> send(null)
}