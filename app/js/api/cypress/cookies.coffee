$Cypress.Cookies = do ($Cypress, _) ->

  reHttp = /^http/

  return {
    set: (name, value) ->
      name = "__cypress.#{name}"

      Cookies.set name, value, {path: "/"}

    get: (name) ->
      name = "__cypress.#{name}"

      Cookies.get(name)

    setInitialRequest: (remoteHost) ->
      @set "initial", true
      @set "remoteHost", remoteHost
      @

    getRemoteHost: ->
      @get "remoteHost"

  }