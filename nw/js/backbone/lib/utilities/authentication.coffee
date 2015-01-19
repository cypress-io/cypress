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

  App.commands.setHandler "login:request", -> API.loginRequest()

  App.vent.on "logging:in", (url) ->
    App.execute "gui:focus"

    code = new Uri(url).getQueryParamValue("code")

    ## display logging in loading spinner
    Request.post("http://#{API_URL}/sessions?code=#{code}").then (res, err) ->
      ## call into cache to store session
      debugger
    .catch ->
      debugger

    # App.vent.trigger "start:projects:app"