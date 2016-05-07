$Cypress.Cookies = do ($Cypress, _) ->

  reHttp = /^http/

  isDebugging = false

  ## TODO have app set this on cypress via config
  namespace = "__cypress"

  preserved = {}

  defaults = {
    whitelist: null
  }

  isNamespaced = (name) ->
    _(name).startsWith(namespace)

  isWhitelisted = (name) ->
    if w = defaults.whitelist
      switch
        when _.isString(w)
          name is w
        when _.isArray(w)
          name in w
        when _.isFunction(w)
          w(name)
        when _.isRegExp(w)
          w.test(name)
        else
          false

  removePreserved = (name) ->
    if preserved[name]
      delete preserved[name]

  return {
    debug: (bool = true) ->
      isDebugging = bool

    log: (cookie, type) ->
      return if not isDebugging

      m = switch type
        when "added"    then "info"
        when "changed"  then "log"
        when "cleared"  then "warn"
        else "log"

      console[m]("Cookie #{type}:", cookie)

    getClearableCookies: (cookies = []) ->
      _.filter cookies, (cookie) ->
        not isWhitelisted(cookie) and not removePreserved(cookie.name)

    set: (name, value) ->
      ## dont set anything if we've been
      ## told to unload
      return if @getCy("unload") is "true"

      if isDebugging and not isNamespaced(name)
        console.info("Cypress.Cookies.set", "name:#{name}", "value:#{value}")

      Cookies.set name, value, {path: "/"}

    get: (name) ->
      Cookies.get(name)

    setCy: (name, value) ->
      @set("#{namespace}.#{name}", value)

    getCy: (name) ->
      @get("#{namespace}.#{name}")

    preserveOnce: (keys...) ->
      _.each keys, (key) ->
        preserved[key] = true

    setInitial: ->
      @setCy "initial", true

    setInitialRequest: (remoteHost) ->
      @setCy "remoteHost", remoteHost
      @setInitial()
      @

    getRemoteHost: ->
      @getCy "remoteHost"

    defaults: (obj = {}) ->
      ## merge obj into defaults
      _.extend defaults, obj

  }