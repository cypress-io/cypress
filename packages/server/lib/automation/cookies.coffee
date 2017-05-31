_         = require("lodash")
Promise   = require("bluebird")
extension = require("@packages/extension")

## match the w3c webdriver spec on return cookies
## https://w3c.github.io/webdriver/webdriver-spec.html#cookies
COOKIE_PROPERTIES = "name value path domain secure httpOnly expiry".split(" ")

normalizeCookies = (cookies, includeHostOnly) ->
  _.map cookies, (c) ->
    normalizeCookieProps(c, includeHostOnly)

normalizeCookieProps = (props, includeHostOnly) ->
  return props if not props

  ## pick off only these specific cookie properties
  ## only if they are defined
  cookie = _.chain(props, COOKIE_PROPERTIES)
  .pick(COOKIE_PROPERTIES)
  .omitBy(_.isUndefined)
  .value()

  if includeHostOnly
    cookie.hostOnly = props.hostOnly

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

cookies = (cyNamespace, cookieNamespace) ->
  isNamespaced = (cookie) ->
    return cookie if not name = cookie?.name

    name.startsWith(cyNamespace) or name is cookieNamespace

  return {
    # normalize: (message, data, automate) ->
    #   invoke = (fn) =>
    #     fn.call(@, data, automate)

    #   fn = switch message
    #     when "get:cookies"   then @getCookies
    #     when "get:cookie"    then @getCookie
    #     when "set:cookie"    then @setCookie
    #     when "clear:cookie"  then @clearCookie
    #     when "clear:cookies" then @clearCookies

    #   invoke(fn)

    getCookies: (data, automate) ->
      { includeHostOnly } = data

      delete data.includeHostOnly

      automate(data)
      .then (cookies) ->
        normalizeCookies(cookies, includeHostOnly)
      .then (cookies) ->
        _.reject(cookies, isNamespaced)

    getCookie: (data, automate) ->
      automate(data)
      .then (cookie) ->
        if isNamespaced(cookie)
          throw new Error("Sorry, you cannot get a Cypress namespaced cookie.")
        else
          cookie
      .then(normalizeCookieProps)

    setCookie: (data, automate) ->
      if isNamespaced(data)
        throw new Error("Sorry, you cannot set a Cypress namespaced cookie.")
      else
        cookie = normalizeCookieProps(data)

        ## lets construct the url ourselves right now
        cookie.url = extension.getCookieUrl(data)

        ## https://github.com/SalesforceEng/tough-cookie#setcookiecookieorstring-currenturl-options-cberrcookie
        ## a host only cookie is when domain was not explictly
        ## set in the Set-Cookie header and instead was implied.
        ## when this is the case we need to remove the domain
        ## property else our cookie will incorrectly be set
        ## as a domain cookie
        if data.hostOnly
          cookie = _.omit(cookie, "domain")

        automate(cookie)
        .then(normalizeCookieProps)

    clearCookie: (data, automate) ->
      if isNamespaced(data)
        throw new Error("Sorry, you cannot clear a Cypress namespaced cookie.")
      else
        automate(data)
        .then(normalizeCookieProps)

    clearCookies: (data, automate) ->
      cookies = _.reject(normalizeCookies(data), isNamespaced)

      clear = (cookie) ->
        automate("clear:cookie", {name: cookie.name})
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
