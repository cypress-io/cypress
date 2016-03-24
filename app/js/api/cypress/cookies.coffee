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

  return {
    debug: (bool = true) ->
      isDebugging = bool

    set: (name, value) ->
      ## dont set anything if we've been
      ## told to unload
      return if @getCy("unload") is "true"

      if isDebugging and not isNamespaced(name)
        console.info("Cypress.Cookies.set", "name:#{name}", "value:#{value}")

      Cookies.set name, value, {path: "/"}

    get: (name) ->
      Cookies.get(name)

    remove: (name, options = {}) ->
      _.defaults options,
        path: "/"
        force: true

      remove = (name) ->
        if isDebugging and not isNamespaced(name)
          console.info("Cypress.Cookies.remove", "name:#{name}")

        Cookies.remove(name, options)

      removePreserved = (name) ->
        if preserved[name]
          delete preserved[name]

      if options.force
        removePreserved(name)
        remove(name)
      else
        if not isWhitelisted(name) and not removePreserved(name)
          remove(name)

    removeCy: (name) ->
      @remove("#{namespace}.#{name}")

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

    getAllCookies: (options = {}) ->
      getAll = ->
        ## return all the cookies except those which
        ## start with our namespace
        _.reduce Cookies.get(), (memo, value, key) ->
          unless isNamespaced(key)
            memo[key] = value

          memo
        , {}

      if doc = options.document
        Cookies.setDocument(doc)
        all = getAll()
        Cookies.setDocument(window.document)

        return all
      else
        getAll()

    clearCookies: (cookie, options = {}) ->
      ## bail if it starts with our namespace
      return if cookie and isNamespaced(cookie)

      options.force = false

      ## if cookie was passed in then just remove cookies
      ## that match that key
      if cookie
        return @remove(cookie, options)

      getAndRemove = (options) =>
        ## else nuke all the cookies except for our namesapce
        _.each Cookies.get(), (value, key) =>
          ## do not remove cypress namespace'd cookies
          ## no matter what
          return if isNamespaced(key)

          @remove(key, options)

      if doc = options.document
        Cookies.setDocument(doc)
        getAndRemove(options)

      Cookies.setDocument(window.document)
      options = _.omit(options, "document")
      getAndRemove(options)

    defaults: (obj = {}) ->
      ## merge obj into defaults
      _.extend defaults, obj

  }