@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  ## TODO: DO WE NEED TO WHITELIST ANYTHING IN ELECTRON?
  App.execute("gui:whitelist", "https://github.com/")

  API =
    loginRequest: ->
      App.ipc("window:open", {
        position: "center"
        focus: true
        width: 1000
        height: 635
        title: "Login"
        type: "GITHUB_LOGIN"
      })

    loggingIn: (url) ->
      ## display logging in loading spinner here
      App.currentUser.loggingIn()

      App.execute "gui:focus"

      code = new Uri(url).getQueryParamValue("code")

      App.config.logIn(code)
        .then (user) ->
          App.currentUser.loggedIn(user)
          App.vent.trigger "start:projects:app"
        .catch (err) ->
          App.currentUser.setLoginError(err)

    clearCookies: (cb) ->
      win = App.request "gui:get"
      win.cookies.getAll {domain: "github.com"}, (cookies) =>
        count = 0
        length = cookies.length

        _.each cookies, (cookie) =>
          prefix = if cookie.secure then "https://" else "http://"
          if cookie.domain[0] is "."
            prefix += "www"

          obj = {name: cookie.name}
          obj.url = prefix + cookie.domain + cookie.path

          win.cookies.remove obj

        cb()

    logOut: (user) ->
      App.config.logOut(user).bind(@).then ->
        @clearCookies ->
          App.vent.trigger "start:login:app"

  App.commands.setHandler "login:request", ->
    API.loginRequest()

  App.vent.on "logging:in", (url) ->
    API.loggingIn(url)

  App.reqres.setHandler "current:user", ->
    App.currentUser or throw new Error("No current user set on App!")

  App.commands.setHandler "set:current:user", (attrs = {}) ->
    App.currentUser = App.request("new:user:entity", attrs)

  App.vent.on "log:out", (user) ->
    API.logOut(user)