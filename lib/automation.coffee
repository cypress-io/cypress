_       = require("lodash")
Promise = require("bluebird")

cookieMiddleware = "get:cookies get:cookie set:cookie clear:cookie clear:cookies".split(" ")

charAfterColonRe = /:(.)/

needsCookieMiddleware = (message) ->
  message in cookieMiddleware

module.exports = (namespace, socketIoCookie) ->

  isCypressNamespaced = (cookie = {}) ->
    cookie.name.startsWith(namespace) or cookie.name is socketIoCookie

  return {
    getCookies: (message, data, automate) ->
      automate(message, data)
      .then (cookies) ->
        _.reject cookies, isCypressNamespaced

    getCookie: (message, data, automate) ->
      automate(message, data)
      .then (cookie) ->
        if isCypressNamespaced(cookie)
          throw new Error("cannot be cypress cookie")
        else
          cookie

    setCookie: (message, data, automate) ->
      if isCypressNamespaced(data)
        throw new Error("cannot set cypress namespaced cookie")
      else
        automate(message, data)

    clearCookie: (message, data, automate) ->
      if isCypressNamespaced(data)
        throw new Error("cannot clear cypress namespaced cookie")
      else
        automate(message, data)

    clearCookies: (message, data, automate) ->
      cookies = _.reject(data, isCypressNamespaced)

      clear = (cookie) ->
        automate("clear:cookie", {name: cookie.name})

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