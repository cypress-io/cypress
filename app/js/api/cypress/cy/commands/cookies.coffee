$Cypress.register "Cookies", (Cypress, _, $) ->

  clearCookies = (key) ->
    Cypress.Cookies.clearCookies(key)

  mergeDefaults = (obj) ->
    merge = (o) ->
      _.defaults o, {domain: window.location.hostname}

    if _.isArray(obj)
      _.map(obj, merge)
    else
      merge(obj)

  Cypress.on "test:before:hooks", ->
    @_automateCookies("get:cookies")
    .then (resp) =>
      ## iterate over all of these and ensure none are whitelisted
      ## or preserved
      @_automateCookies("clear:cookies", resp)

  Cypress.Cy.extend
    _automateCookies: (event, obj = {}, log) ->
      new Promise (resolve, reject) =>
        fn = (resp) =>
          if e = resp.__error
            err = @cypressErr(e)
            err.name = resp.__name
            err.stack = resp.__stack

            try
              @throwErr(err, log)
            catch e
              reject(e)
          else
            resolve(resp.response)

        Cypress.trigger(event, mergeDefaults(obj), fn)

  Cypress.addParentCommand

    # clearCookie: (key) ->
    #   if not _.isString(key)
    #     @throwErr "cy.clearCookie must be passed a string argument"

    #   doc   = @private("document")
    #   path  = @_getLocation("pathname")
    #   paths = path.split("/")

    #   _.each paths, (p, i) ->
    #     p = paths.slice(0, i + 1).join("/") or "/"
    #     Cypress.Cookies.clearCookies(key, {path: p, document: doc})

    #   cookies = Cypress.Cookies.getAllCookies()

    #   Cypress.Log.command
    #     end: true
    #     snapshot: true
    #     onConsole: ->
    #       cookies: cookies

    #   return cookies

    getCookie: (name) ->
      @_automateCookies("get:cookie", {name: name})
      .then (resp) ->
        console.log resp

    getCookies: (options = {}) ->
      _.defaults options, {
        log: true
      }

      if options.log
        options._log = Cypress.Log.command({
          displayName: "get cookies"
          onConsole: ->
            obj = {}

            if c = options.cookies
              obj["Returned"] = c
              obj["Num Cookies"] = c.length

            obj
        })

      @_automateCookies("get:cookies", {}, options._log)
      .then (resp) ->
        options.cookies = resp

        return resp

    setCookie: (name, value, options = {}) ->
      _.defaults options, {
        name: name
        value: value
        path: "/"
        secure: false
        httpOnly: false
        log: true
        # expiry: 123123123
      }

      cookie = _.pick(options, "name", "value", "path", "secure", "httpOnly", "expiry")

      if options.log
        options._log = Cypress.Log.command({
          displayName: "set cookie"
          onConsole: ->
            obj = {}

            if c = options.cookie
              obj["Returned"] = c

            obj
        })

      @_automateCookies("set:cookie", cookie, options._log)
      .then (resp) ->
        options.cookie = resp

        return resp

    clearCookie: (name) ->
      ## TODO: prevent clearing a cypress namespace
      @_automateCookies("clear:cookie", {name: name})
      .then (resp) ->
        console.log resp

    clearCookies: ->
      @_automateCookies("get:cookies")
      .then (resp) =>
        ## iterate over all of these and ensure none are whitelisted
        ## or preserved
        @_automateCookies("clear:cookies", resp)
      .then (resp) ->
        console.log resp
      # doc   = @private("document")
      # path  = @_getLocation("pathname")
      # paths = path.split("/")

      # _.each paths, (p, i) ->
      #   p = paths.slice(0, i + 1).join("/") or "/"
      #   Cypress.Cookies.clearCookies(null, {path: p, document: doc})

      # cookies = Cypress.Cookies.getAllCookies()

      # Cypress.Log.command
      #   end: true
      #   snapshot: true
      #   onConsole: ->
      #     cookies: cookies

      # return cookies