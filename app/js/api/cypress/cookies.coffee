$Cypress.Cookies = do ($Cypress, _) ->

  reHttp = /^http/

  return {
    set: (name, value) ->
      name = "__cypress.#{name}"

      Cookies.set name, value, {path: "/"}

    setInitialRequest: (remoteHost) ->
      @set "initial", true
      @set "remoteHost", remoteHost
      @

  }