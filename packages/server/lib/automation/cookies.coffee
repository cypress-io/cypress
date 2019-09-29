_         = require("lodash")
Promise   = require("bluebird")
extension = require("@packages/extension")
debug     = require("debug")("cypress:server:cookies")

## match the w3c webdriver spec on return cookies
## https://w3c.github.io/webdriver/webdriver-spec.html#cookies
COOKIE_PROPERTIES = "name value path domain secure httpOnly expiry hostOnly".split(" ")

normalizeCookies = (cookies) ->
  _.map cookies, normalizeCookieProps

normalizeCookieProps = (props) ->
  return props if not props

  ## pick off only these specific cookie properties
  ## only if they are defined
  cookie = _.chain(props)
  .pick(COOKIE_PROPERTIES)
  .omitBy(_.isUndefined)
  .omitBy(_.isNull)
  .value()

  ## when sending cookie props we need to convert
  ## expiry to expirationDate
  ## ...
  ## and when receiving cookie props we need to convert
  ## expirationDate to expiry and always remove url
  switch
    when props.expiry?
      delete cookie.expiry
      cookie.expirationDate = props.expiry
    when props.expirationDate?
      delete cookie.expirationDate
      delete cookie.url
      cookie.expiry = props.expirationDate

  cookie

normalizeGetCookies = (cookies) ->
  _.chain(cookies)
  .map(normalizeGetCookieProps)
  ## sort in order of expiration date, ascending
  .sortBy(_.partialRight(_.get, 'expiry', Number.MAX_SAFE_INTEGER))
  .value()

normalizeGetCookieProps = (props) ->
  return props if not props

  cookie = normalizeCookieProps(props)
  _.omit(cookie, 'hostOnly')

cookies = (cyNamespace, cookieNamespace) ->
  isNamespaced = (cookie) ->
    name = cookie and cookie.name

    ## if the cookie has no name, return false
    if not name
      return false

    name.startsWith(cyNamespace) or name is cookieNamespace

  return {
    getCookies: (data, automate) ->
      debug("getting:cookies %o", data)

      automate(data)
      .then (cookies) ->
        cookies = normalizeGetCookies(cookies)
        cookies = _.reject(cookies, isNamespaced)

        debug("received get:cookies %o", cookies)

        return cookies

    getCookie: (data, automate) ->
      debug("getting:cookie %o", data)

      automate(data)
      .then (cookie) ->
        if isNamespaced(cookie)
          throw new Error("Sorry, you cannot get a Cypress namespaced cookie.")
        else
          cookie = normalizeGetCookieProps(cookie)

          debug("received get:cookie %o", cookie)

          return cookie

    setCookie: (data, automate) ->
      if isNamespaced(data)
        throw new Error("Sorry, you cannot set a Cypress namespaced cookie.")
      else
        cookie = normalizeCookieProps(data)

        ## lets construct the url ourselves right now
        ## unless we already have a URL
        cookie.url = data.url ? extension.getCookieUrl(data)

        debug("set:cookie %o", cookie)

        automate(cookie)
        .then (cookie) ->
          cookie = normalizeGetCookieProps(cookie)

          debug("received set:cookie %o", cookie)

          return cookie

    clearCookie: (data, automate) ->
      if isNamespaced(data)
        throw new Error("Sorry, you cannot clear a Cypress namespaced cookie.")
      else
        debug("clear:cookie %o", data)

        automate(data)
        .then (cookie) ->
          cookie = normalizeCookieProps(cookie)

          debug("received clear:cookie %o", cookie)

          return cookie

    clearCookies: (data, automate) ->
      cookies = _.reject(normalizeCookies(data), isNamespaced)

      debug("clear:cookies %o", cookies)

      clear = (cookie) ->
        automate("clear:cookie", { name: cookie.name, domain: cookie.domain })
        .then(normalizeCookieProps)

      Promise.map(cookies, clear)

    changeCookie: (data) ->
      c = normalizeCookieProps(data.cookie)

      return if isNamespaced(c)

      msg = if data.removed
        "Cookie Removed: '#{c.name}'"
      else
        "Cookie Set: '#{c.name}'"

      return {
        cookie:  c
        message: msg
        removed: data.removed
      }

  }

cookies.normalizeCookies     = normalizeCookies
cookies.normalizeCookieProps = normalizeCookieProps

module.exports = cookies
