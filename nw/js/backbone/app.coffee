gui            = require('nw.gui')
Server         = require('../../lib/server')
Request        = require("request-promise")
API_URL        = "http://api.cypress.io"

gui.App.addOriginAccessWhitelistEntry('https://github.com/', 'app', 'app', true);

GITHUB_OAUTH   = "https://github.com/login/oauth/authorize"
GITHUB_PARAMS  =
  client_id:    "71bdc3730cd85d30955a"
  scope:        "user:email"

@App = do (Backbone, Marionette) ->

  App = new Marionette.Application

  global.App = App

  App.addRegions
    mainRegion:  "#main-region"

  ## store the default region as the main region
  App.reqres.setHandler "default:region", -> App.mainRegion

  App.on "start", (options = {}) ->
    ## check cache store for session id

    ## if have it, start projects

    ## else login
    App.vent.trigger "start:login:app"

  App.startIdGenerator = (path) ->
    if !path
      throw new Error("Missing http path to ID Generator.  Cannot start ID Generator.")

    idWin = gui.Window.open(path)
    idWin.hide()

  App.commands.setHandler "login:request", ->
    url = _.reduce GITHUB_PARAMS, (memo, value, key) ->
      memo.addQueryParam(key, value)
      memo
    , new Uri(GITHUB_OAUTH)

    new gui.Window.open url.toString(),
      position: "center"
      focus: true

  App.commands.setHandler "run:project", (path) ->
    Server(projectRoot: path)
    .then (config) ->
      App.startIdGenerator(config.idGeneratorPath)

  App.vent.on "logging:in", (code) ->
    ## display logging in loading spinner

    Request.post("http://#{API_URL}/sessions?code=#{code}").then (res, err) ->
      ## call into cache to store session
      debugger

    gui.Window.get().focus()
    # App.vent.trigger "start:projects:app"

  return App