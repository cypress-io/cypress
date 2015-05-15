$Cypress.Cookies = do ($Cypress, _) ->

  reHttp = /^http/

  return {
    set: (name, value) ->
      name = "__cypress.#{name}"

      Cookies.set name, value, {path: "/"}

    get: (name) ->
      name = "__cypress.#{name}"

      Cookies.get(name)

    setInitial: ->
      @set "initial", true

    setInitialRequest: (remoteHost) ->
      @set "remoteHost", remoteHost
      @setInitial()
      @

    getRemoteHost: ->
      @get "remoteHost"

  }