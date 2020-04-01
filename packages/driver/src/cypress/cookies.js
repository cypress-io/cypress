_ = require("lodash")
Cookies = require("js-cookie")

$errUtils = require("./error_utils")

reHttp = /^http/

isDebugging = false
isDebuggingVerbose = false

preserved = {}

defaults = {
  whitelist: null
}

$Cookies = (namespace, domain) ->
  isNamespaced = (name) ->
    _.startsWith(name, namespace)

  isWhitelisted = (cookie) ->
    if w = defaults.whitelist
      switch
        when _.isString(w)
          cookie.name is w
        when _.isArray(w)
          cookie.name in w
        when _.isFunction(w)
          w(cookie)
        when _.isRegExp(w)
          w.test(cookie.name)
        else
          false

  removePreserved = (name) ->
    if preserved[name]
      delete preserved[name]

  API = {
    debug: (bool = true, options = {}) ->
      _.defaults options, {
        verbose: true
      }

      isDebugging = bool
      isDebuggingVerbose = bool and options.verbose

    log: (message, cookie, removed) ->
      return if not isDebugging

      m = if removed then "warn" else "info"

      args = [_.truncate(message, { length: 50 })]

      if isDebuggingVerbose
        args.push(cookie)

      console[m].apply(console, args)

    getClearableCookies: (cookies = []) ->
      _.filter cookies, (cookie) ->
        not isWhitelisted(cookie) and not removePreserved(cookie.name)

    _set: (name, value, options = {}) ->
      ## dont set anything if we've been
      ## told to unload
      return if @getCy("unload") is "true"

      _.defaults options, {
        path: "/"
      }

      Cookies.set(name, value, options)

    _get: (name) ->
      Cookies.get(name)

    setCy: (name, value, options = {}) ->
      _.defaults(options, {
        domain: domain
      })

      @_set("#{namespace}.#{name}", value, options)

    getCy: (name) ->
      @_get("#{namespace}.#{name}")

    preserveOnce: (keys...) ->
      _.each keys, (key) ->
        preserved[key] = true

    clearCypressCookies: ->
      _.each Cookies.get(), (value, key) ->
        if isNamespaced(key)
          Cookies.remove(key, {
            path: "/"
            domain: domain
          })

    setInitial: ->
      @setCy("initial", true)

    defaults: (obj = {}) ->
      ## merge obj into defaults
      _.extend defaults, obj

  }

  _.each ["get", "set", "remove", "getAllCookies", "clearCookies"], (method) ->
    API[method] = ->
      $errUtils.throwErrByPath("cookies.removed_method", {
        args: { method }
      })

  return API

$Cookies.create = (namespace, domain) ->
  ## set the $Cookies function onto the Cypress instance
  $Cookies(namespace, domain)

module.exports = $Cookies
