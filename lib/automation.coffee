_       = require("lodash")
Promise = require("bluebird")

cookieMiddleware = "get:cookies get:cookie set:cookie clear:cookie clear:cookies".split(" ")

charAfterColonRe = /:(.)/

## match the w3c webdriver spec on return cookies
## https://w3c.github.io/webdriver/webdriver-spec.html#cookies
COOKIE_PROPERTIES = "name value path domain secure httpOnly expiry".split(" ")

needsCookieMiddleware = (message) ->
  message in cookieMiddleware

normalizeCookies = (cookies) ->
  _.map(cookies, normalizeCookieProps)

normalizeCookieProps = (data) ->
  return data if not data

  ## pick off only these specific cookie properties
  cookie = _.pick(data, COOKIE_PROPERTIES)

  ## when sending cookie data we need to convert
  ## expiry to expirationDate
  ## ...
  ## and when receiving cookie data we need to convert
  ## expirationDate to expiry
  switch
    when e = data.expiry
      delete cookie.expiry
      cookie.expirationDate = e
    when e = data.expirationDate
      delete cookie.expirationDate
      cookie.expiry = e

  cookie

module.exports = (namespace, socketIoCookie) ->

  isCypressNamespaced = (cookie) ->
    return cookie if not name = cookie?.name

    name.startsWith(namespace) or name is socketIoCookie

  return {
    getCookies: (message, data, automate) ->
      automate(message, data)
      .then(normalizeCookies)
      .then (cookies) ->
        _.reject(cookies, isCypressNamespaced)

    getCookie: (message, data, automate) ->
      automate(message, data)
      .then (cookie) ->
        if isCypressNamespaced(cookie)
          throw new Error("Sorry, you cannot get a Cypress namespaced cookie.")
        else
          cookie
      .then(normalizeCookieProps)

    setCookie: (message, data, automate) ->
      if isCypressNamespaced(data)
        throw new Error("Sorry, you cannot set a Cypress namespaced cookie.")
      else
        cookie = normalizeCookieProps(data)

        automate(message, cookie)
        .then(normalizeCookieProps)

    clearCookie: (message, data, automate) ->
      if isCypressNamespaced(data)
        throw new Error("Sorry, you cannot clear a Cypress namespaced cookie.")
      else
        automate(message, data)
        .then(normalizeCookieProps)

    clearCookies: (message, data, automate) ->
      cookies = _.reject(normalizeCookies(data), isCypressNamespaced)

      clear = (cookie) ->
        automate("clear:cookie", {name: cookie.name})
        .then(normalizeCookieProps)

      Promise.map(cookies, clear)

    handleCookies: (message, data, automate) ->
      Promise.try =>
        fn = message.replace charAfterColonRe, (match, p1) ->
          p1.toUpperCase()

        @[fn](message, data, automate)

    request: (message, data, automate) ->
      if needsCookieMiddleware(message)
        @handleCookies(message, data, automate)
      else
        automate(message, data)
  }