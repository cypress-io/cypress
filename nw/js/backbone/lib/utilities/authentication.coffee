@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  Request        = require("request-promise")

  API_URL        = "http://api.cypress.io"
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
      App.execute "gui:open", @createUrl(),
        position: "center"
        focus: true

    loggingIn: (url) ->
      ## display logging in loading spinner here

      App.execute "gui:focus"

      App.config.setSessionId("foobarbaz123").then ->
        App.vent.trigger "start:projects:app"

      # code = new Uri(url).getQueryParamValue("code")

      # Request.post("http://#{API_URL}/sessions?code=#{code}").then (res, err) ->
      #   ## call into cache to store session
      #   debugger
      # .catch ->
      #   debugger

      # App.vent.trigger "start:projects:app"

  App.commands.setHandler "login:request", -> API.loginRequest()

  App.vent.on "logging:in", (url) -> API.loggingIn(url)
