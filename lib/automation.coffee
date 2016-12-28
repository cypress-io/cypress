_           = require("lodash")
Promise     = require("bluebird")
extension   = require("@cypress/core-extension")
screenshots = require("./screenshots")


middlewareMesssages = "take:screenshot get:cookies get:cookie set:cookie clear:cookie clear:cookies".split(" ")

charAfterColonRe = /:(.)/

## match the w3c webdriver spec on return cookies
## https://w3c.github.io/webdriver/webdriver-spec.html#cookies
COOKIE_PROPERTIES = "name value path domain secure httpOnly expiry".split(" ")

needsMiddleware = (message) ->
  message in middlewareMesssages

normalizeCookies = (cookies, includeHostOnly) ->
  _.map cookies, (c) ->
    normalizeCookieProps(c, includeHostOnly)

normalizeCookieProps = (data, includeHostOnly) ->
  return data if not data

  ## pick off only these specific cookie properties
  ## only if they are defined
  cookie = _.chain(data, COOKIE_PROPERTIES)
  .pick(COOKIE_PROPERTIES)
  .omitBy(_.isUndefined)
  .value()

  if includeHostOnly
    cookie.hostOnly = data.hostOnly

  ## when sending cookie data we need to convert
  ## expiry to expirationDate
  ## ...
  ## and when receiving cookie data we need to convert
  ## expirationDate to expiry and always remove url
  switch
    when data.expiry?
      delete cookie.expiry
      cookie.expirationDate = data.expiry
    when data.expirationDate?
      delete cookie.expirationDate
      delete cookie.url
      cookie.expiry = data.expirationDate

  cookie

automation = (namespace, socketIoCookie, screenshotsFolder) ->

  isCypressNamespaced = (cookie) ->
    return cookie if not name = cookie?.name

    name.startsWith(namespace) or name is socketIoCookie

  return {
    getCookies: (message, data, automate) ->
      { includeHostOnly } = data

      delete data.includeHostOnly

      automate(message, data)
      .then (cookies) ->
        normalizeCookies(cookies, includeHostOnly)
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

        ## lets construct the url ourselves right now
        cookie.url = extension.getCookieUrl(data)

        ## https://github.com/SalesforceEng/tough-cookie#setcookiecookieorstring-currenturl-options-cberrcookie
        ## a host only cookie is when domain was not explictly
        ## set in the Set-Cookie header and instead was implied.
        ## when this is the case we need to remove the domain
        ## property else our cookie will incorrectly be set
        ## as a domain cookie
        if cookie.hostOnly
          cookie = _.omit(cookie, "domain")

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

    takeScreenshot: (message, data, automate) ->
      automate(message, data)
      .then (dataUrl) ->
        screenshots.take(data, dataUrl, screenshotsFolder)

    applyMiddleware: (message, data, automate) ->
      Promise.try =>
        fn = message.replace charAfterColonRe, (match, p1) ->
          p1.toUpperCase()

        @[fn](message, data, automate)

    changeCookie: (data, cb) ->
      c = normalizeCookieProps(data.cookie)

      return if isCypressNamespaced(c)

      msg = if data.removed
        "Cookie Removed: '#{c.name}=#{c.value}'"
      else
        "Cookie Set: '#{c.name}=#{c.value}'"

      cb({
        cookie:  c
        message: msg
        removed: data.removed
      })

    request: (message, data, automate) ->
      if needsMiddleware(message)
        @applyMiddleware(message, data, automate)
      else
        automate(message, data)

    pushMessage: (message, data, cb) ->
      switch message
        when "change:cookie"
          @changeCookie(data, cb)
        else
          throw new Error("Automation push message: '#{message}' not recognized.")
  }

automation.normalizeCookieProps = normalizeCookieProps
automation.normalizeCookies     = normalizeCookies

module.exports = automation
