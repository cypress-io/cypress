$Cypress.register "Cookies", (Cypress, _, $, Promise, moment) ->

  COOKIE_PROPS = "name value path secure httpOnly expiry".split(" ")

  mergeDefaults = (obj) ->
    merge = (o) ->
      _.defaults o, {domain: window.location.hostname}

    if _.isArray(obj)
      _.map(obj, merge)
    else
      merge(obj)

  getAndClear = (log) ->
    @_automateCookies("get:cookies", {}, log)
    .then (resp) =>
      ## bail early if we got no cookies!
      return resp if resp and resp.length is 0

      ## iterate over all of these and ensure none are whitelisted
      ## or preserved
      cookies = Cypress.Cookies.getClearableCookies(resp)
      @_automateCookies("clear:cookies", cookies, log)

  Cypress.on "test:before:hooks", ->
    ## TODO: handle failure here somehow
    ## maybe by tapping into the Cypress reset
    ## stuff, or handling this in the runner itself?
    getAndClear.call(@)

  Cypress.Cy.extend
    _addTwentyYears: ->
      moment().add(20, "years").unix()

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
    getCookie: (name, options = {}) ->
      _.defaults options, {
        log: true
      }

      if options.log
        options._log = Cypress.Log.command({
          displayName: "get cookie"
          onConsole: ->
            obj = {}

            if c = options.cookie
              obj["Returned"] = c
            else
              obj["Returned"] = "null"
              obj["Note"] = "No cookie with the name: '#{name}' was found."

            obj
        })

      if not _.isString(name)
        @throwErr("cy.getCookie() must be passed a string argument for name.", options._log)

      @_automateCookies("get:cookie", {name: name}, options._log)
      .then (resp) ->
        options.cookie = resp

        return resp

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
        expiry: @_addTwentyYears()
      }

      cookie = _.pick(options, COOKIE_PROPS)

      if options.log
        options._log = Cypress.Log.command({
          displayName: "set cookie"
          onConsole: ->
            obj = {}

            if c = options.cookie
              obj["Returned"] = c

            obj
        })

      if not _.isString(name) or not _.isString(value)
        @throwErr("cy.setCookie() must be passed two string arguments for name and value.", options._log)

      @_automateCookies("set:cookie", cookie, options._log)
      .then (resp) ->
        options.cookie = resp

        return resp

    clearCookie: (name, options = {}) ->
      _.defaults options, {
        log: true
      }

      if options.log
        options._log = Cypress.Log.command({
          displayName: "clear cookie"
          onConsole: ->
            obj = {}

            obj["Returned"] = "null"

            if c = options.cookie
              obj["Cleared Cookie"] = c
            else
              obj["Note"] = "No cookie with the name: '#{name}' was found or removed."

            obj
        })

      if not _.isString(name)
        @throwErr("cy.clearCookie() must be passed a string argument for name.", options._log)

      ## TODO: prevent clearing a cypress namespace
      @_automateCookies("clear:cookie", {name: name}, options._log)
      .then (resp) ->
        options.cookie = resp

        ## null out the current subject
        return null

    clearCookies: (options = {}) ->
      _.defaults options, {
        log: true
      }

      if options.log
        options._log = Cypress.Log.command({
          displayName: "clear cookies"
          onConsole: ->
            obj = {}

            obj["Returned"] = "null"

            if (c = options.cookies) and c.length
              obj["Cleared Cookies"] = c
              obj["Num Cookies"] = c.length
            else
              obj["Note"] = "No cookies were found or removed."

            obj
        })

      getAndClear.call(@, options._log)
      .then (resp) ->
        options.cookies = resp

        ## null out the current subject
        return null