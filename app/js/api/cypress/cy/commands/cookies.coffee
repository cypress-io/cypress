$Cypress.register "Cookies", (Cypress, _, $) ->

  clearCookies = (key) ->
    Cypress.Cookies.clearCookies(key)

    Cypress.Cookies.getAllCookies()

  Cypress.on "test:before:hooks", ->
    ## remove all the cookies before each test
    clearCookies()

  Cypress.addParentCommand

    clearCookie: (key) ->
      if not _.isString(key)
        @throwErr "cy.clearCookie must be passed a string argument"

      cookies = clearCookies(key)

      Cypress.command
        end: true
        snapshot: true
        onConsole: ->
          cookies: cookies

      return cookies

    clearCookies: ->
      cookies = clearCookies()

      Cypress.command
        end: true
        snapshot: true
        onConsole: ->
          cookies: cookies

      return cookies