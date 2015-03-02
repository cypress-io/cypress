@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  Request        = require("request-promise")

  ## these all need to move to .env variables
  GITHUB_OAUTH   = "https://github.com/login/oauth/authorize"
  GITHUB_PARAMS  =
    client_id:    "71bdc3730cd85d30955a"
    scope:        "user:email"

  App.execute("gui:whitelist", "https://github.com/")

  API =
    createUrl: ->
      url = _.reduce GITHUB_PARAMS, (memo, value, key) ->
        memo.addQueryParam(key, value)
        memo
      , new Uri(GITHUB_OAUTH)

      url.toString()

    loginRequest: ->
      App.request "gui:open", @createUrl(),
        position: "center"
        focus: true
        width: 900
        height: 500

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