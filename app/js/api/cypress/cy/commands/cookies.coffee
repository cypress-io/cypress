$Cypress.register "Cookies", (Cypress, _, $) ->

  clearCookies = (key) ->
    Cypress.Cookies.clearCookies(key)

  Cypress.on "test:before:hooks", ->
    ## remove all the cookies before each test
    clearCookies()

  Cypress.addParentCommand

    clearCookie: (key) ->
      if not _.isString(key)
        @throwErr "cy.clearCookie must be passed a string argument"

      doc   = @private("document")
      path  = @_getLocation("pathname")
      paths = path.split("/")

      _.each paths, (p, i) ->
        p = paths.slice(0, i + 1).join("/") or "/"
        Cypress.Cookies.clearCookies(key, {path: p, document: doc})

      cookies = Cypress.Cookies.getAllCookies()

      Cypress.Log.command
        end: true
        snapshot: true
        onConsole: ->
          cookies: cookies

      return cookies

    clearCookies: ->
      doc   = @private("document")
      path  = @_getLocation("pathname")
      paths = path.split("/")

      _.each paths, (p, i) ->
        p = paths.slice(0, i + 1).join("/") or "/"
        Cypress.Cookies.clearCookies(null, {path: p, document: doc})

      cookies = Cypress.Cookies.getAllCookies()

      Cypress.Log.command
        end: true
        snapshot: true
        onConsole: ->
          cookies: cookies

      return cookies