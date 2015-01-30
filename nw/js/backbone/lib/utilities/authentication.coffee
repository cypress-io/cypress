@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  Request        = require("request-promise")

  API_URL        = "http://localhost:1234"
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

      App.execute "gui:focus"

      code = new Uri(url).getQueryParamValue("code")

      App.config.logIn("#{API_URL}/signin?code=#{code}").then ->
        App.vent.trigger "start:projects:app"

  App.commands.setHandler "login:request", -> API.loginRequest()

  App.vent.on "logging:in", (url) -> API.loggingIn(url)
