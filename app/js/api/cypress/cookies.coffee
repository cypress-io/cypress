$Cypress.Cookies = do ($Cypress, _, Cookies) ->

  reHttp = /^http/

  ## TODO have app set this on cypress via config
  namespace = "__cypress"

  return {
    set: (name, value) ->
      ## dont set anything if we've been
      ## told to unload
      return if @get("unload") is "true"

      name = "#{namespace}.#{name}"

      Cookies.set name, value, {path: "/"}

    get: (name) ->
      name = "#{namespace}.#{name}"

      Cookies.get(name)

    setInitial: ->
      @set "initial", true

    setInitialRequest: (remoteHost) ->
      @set "remoteHost", remoteHost
      @setInitial()
      @

    getRemoteHost: ->
      @get "remoteHost"

    getAllCookies: ->
      ## return all the cookies except those which
      ## start with our namespace
      _.reduce Cookies.get(), (memo, value, key) ->
        unless _(key).startsWith(namespace)
          memo[key] = value

        memo
      , {}

    clearCookies: (cookie) ->
      ## bail if it starts with our namespace
      return if cookie and _(cookie).startsWith(namespace)

      removeCookie = (key) ->
        Cookies.remove(key, {path: "/"})

      ## if cookie was passed in then just remove cookies
      ## that match that key
      if cookie
        return removeCookie(cookie)

      ## else nuke all the cookies except for our namesapce
      _.each Cookies.get(), (value, key) ->
        ## do not remove cypress namespace'd cookies
        ## no matter what
        return if _(key).startsWith(namespace)

        removeCookie(key)

  }